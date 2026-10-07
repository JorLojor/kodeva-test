# Deploy Kodeva → MicroK8s (GHCR + Traefik + Cloudflare)

Mengikuti `infrathings/cicd-setups/deploy-fe-nextjs-be-hono.md`, disesuaikan untuk monorepo ini.

| App | Image | Domain |
| --- | --- | --- |
| `apps/web` (Next.js standalone) | `ghcr.io/jorlojor/kodeva-web` | `dicobainaja.com`, `www.dicobainaja.com` |
| `apps/dashboard` (Vite SPA, nginx) | `ghcr.io/jorlojor/kodeva-dashboard` | `dashboard.dicobainaja.com` |
| `apps/api` (Hono/Bun) | `ghcr.io/jorlojor/kodeva-api` | `api.dicobainaja.com` |
| Postgres 17 (StatefulSet, ZENX) | `postgres:17-alpine` | internal `kodeva-postgres.kodeva.svc.cluster.local` |

Namespace: `kodeva`. Semua container listen di port `3000`.

File terkait: `apps/*/Dockerfile` (build context = root repo), `apps/dashboard/nginx.conf`,
`.dockerignore`, `k8s/kodeva.yaml`, `.github/workflows/deploy.yml`.

## Perbedaan dari guide

- **Build context root repo.** `bun.lock` dan `packages/*` ada di root; Dockerfile menyalin semua
  `package.json` workspace agar `bun install --frozen-lockfile` jalan.
- **Web dan dashboard memanggil API dari browser**, jadi keduanya memakai domain publik
  `https://api.dicobainaja.com` (bukan DNS internal). `NEXT_PUBLIC_API_URL` dan `VITE_API_URL`
  di-inline saat build lewat build-arg di workflow.
- **Migration otomatis** lewat init container `migrate` di Deployment API
  (`bun run src/db/migrate.ts`), jalan sebelum API menerima traffic.
- **IP klien untuk rate limit** dibaca dari header `cf-connecting-ip` (`TRUSTED_IP_HEADER`).
  Tanpa ini, semua pengunjung terhitung satu IP (pod Traefik) dan form lead/order cepat kena 429.
- **Probe:** API `/api/v1/health`, dashboard `/healthz`, web `/products` (tidak bergantung API).

## 1. Cloudflare

DNS sudah ada: `@`, `api`, `dashboard` masing-masing 3 A record (ZENX/XEON/EPYC) Proxied,
`www` CNAME ke root, `cdn` ke bucket R2.

1. **SSL/TLS → Origin Server → Create Certificate** untuk `dicobainaja.com` (default:
   `*.dicobainaja.com` + `dicobainaja.com`). Simpan certificate dan private key.
2. Setelah langkah 2.3 selesai: **SSL/TLS → Overview → Full (strict)**.

## 2. Cluster (di ZENX, sekali)

```bash
kubectl create namespace kodeva
kubectl get storageclass   # harus ada microk8s-hostpath; kalau beda, ubah k8s/kodeva.yaml
```

### 2.1 GHCR pull secret (reuse dari namespace lain)

```bash
kubectl get secret ghcr-cred -n <namespace-lain> \
  -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d > /tmp/dockerconfig.json
kubectl create secret generic ghcr-cred -n kodeva \
  --from-file=.dockerconfigjson=/tmp/dockerconfig.json \
  --type=kubernetes.io/dockerconfigjson
shred -u /tmp/dockerconfig.json
```

### 2.2 TLS

```bash
nano /tmp/origin.crt   # paste Origin Certificate
nano /tmp/origin.key   # paste Private Key
kubectl create secret tls kodeva-tls -n kodeva --cert=/tmp/origin.crt --key=/tmp/origin.key
shred -u /tmp/origin.crt /tmp/origin.key
```

### 2.3 Secret Postgres + API (berurutan, satu sesi)

Nilai `CDN_*` sama dengan `apps/api/.env` lokal. `CDN_ENDPOINT` hanya host
(`https://<account-id>.r2.cloudflarestorage.com`), tanpa path bucket.

```bash
DB_PASS=$(openssl rand -hex 20)

kubectl create secret generic kodeva-postgres-secret -n kodeva \
  --from-literal=POSTGRES_USER=kodeva \
  --from-literal=POSTGRES_PASSWORD="$DB_PASS" \
  --from-literal=POSTGRES_DB=kodeva_db

read -rsp "CDN_ACCESS_KEY_ID: " CDN_ID && echo
read -rsp "CDN_SECRET: " CDN_SECRET && echo
read -rp  "CDN_ENDPOINT: " CDN_ENDPOINT

kubectl create secret generic kodeva-api-secret -n kodeva \
  --from-literal=DATABASE_URL="postgres://kodeva:${DB_PASS}@kodeva-postgres.kodeva.svc.cluster.local:5432/kodeva_db?sslmode=disable" \
  --from-literal=CDN_REGION=auto \
  --from-literal=CDN_ACCESS_KEY_ID="$CDN_ID" \
  --from-literal=CDN_SECRET="$CDN_SECRET" \
  --from-literal=CDN_BUCKET=cobabucket \
  --from-literal=CDN_ENDPOINT="$CDN_ENDPOINT" \
  --from-literal=CDN_PUBLIC_URL=https://cdn.dicobainaja.com

unset DB_PASS CDN_ID CDN_SECRET CDN_ENDPOINT
kubectl -n kodeva get secret   # DATA: postgres-secret 3, api-secret 7, kodeva-tls 2
```

## 3. GitHub

Repo `JorLojor/kodeva-test` → **Settings → Secrets and variables → Actions** → `KUBE_CONFIG`:

```bash
# di ZENX
microk8s config | sed 's|server: https://.*:16443|server: https://165.101.18.130:16443|' > /tmp/kubeconfig
grep server: /tmp/kubeconfig   # harus 165.101.18.130
base64 -w0 /tmp/kubeconfig     # copy ke secret KUBE_CONFIG, jangan paste ke chat
shred -u /tmp/kubeconfig
```

## 4. Deploy

Workflow jalan saat push ke `main` (atau manual: Actions → Build & Deploy kodeva → Run workflow).
Push pertama membangun ketiga image. Berikutnya hanya app yang berubah; perubahan `packages/`,
`bun.lock`, atau `k8s/` membangun semuanya.

```bash
gh run watch
```

### Seed data (opsional, sekali)

`src/db/seed/data.sql` berisi data development, termasuk akun admin lokal. Jalankan hanya pada
database kosong:

```bash
kubectl -n kodeva exec deploy/kodeva-api -c kodeva-api -- bun run src/db/seed/seed.ts
```

## 5. Verifikasi

```bash
kubectl -n kodeva get pods -o wide
kubectl -n kodeva logs deploy/kodeva-api -c migrate        # hasil migration
curl -s https://api.dicobainaja.com/api/v1/health
for h in dicobainaja.com dashboard.dicobainaja.com; do
  curl -s -o /dev/null -w "$h %{http_code}\n" https://$h
done
```

## Troubleshooting

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| API `Init:CrashLoopBackOff` | Migration gagal (DB belum ready / `DATABASE_URL` salah) | `kubectl -n kodeva logs <pod> -c migrate` |
| API crash `Environment validation failed` | Ada `CDN_*` kosong di secret | Cek jumlah DATA `kodeva-api-secret` = 7 |
| Dashboard login gagal / CORS | Origin tidak ada di `ORIGIN` | Ubah env `ORIGIN` di `k8s/kodeva.yaml` |
| Form lead/order langsung 429 | Rate limit membaca IP Traefik | Pastikan `TRUSTED_IP_HEADER=cf-connecting-ip` |
| Gambar CMS tidak tampil di web | Host gambar bukan `cdn.dicobainaja.com/uploads/**` | Sesuaikan `images.remotePatterns` di `apps/web/next.config.ts` |
| 526 dari Cloudflare | Full (strict) tapi `kodeva-tls` belum ada | Buat secret TLS (2.2) |
