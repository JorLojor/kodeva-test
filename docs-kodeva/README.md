# Kodeva

Monorepo Bun untuk website publik Kodeva, dashboard admin, dan API. Fitur utamanya CMS halaman
landing, blog, lead capture, marketplace dengan pembayaran transfer manual, dan tracking marketing.

## Waktu pengerjaan

Tanggal penyusunan: 6–7 Oktober 2026.

| Tanggal | Sesi | Durasi |
| --- | --- | --- |
| 6 Oktober 2026 | 21.22 – 22.06 | 44 menit |
| 7 Oktober 2026 | 06.30 – 08.05 | 1 jam 35 menit |
| 7 Oktober 2026 | 17.21 – 21.30 | 4 jam 9 menit |
| **Total** | | **6 jam 28 menit** |

## Workspace

| Direktori | Package | Stack |
| --- | --- | --- |
| `apps/api` | `@jortemplate/api` | Hono, TypeScript, Bun, PostgreSQL, Drizzle, Cloudflare R2 (SDK S3) |
| `apps/web` | `@jortemplate/web` | Next.js App Router, TypeScript, TanStack Query, Tailwind |
| `apps/dashboard` | `@jortemplate/dashboard` | React, Vite, TypeScript, TanStack Query, Tailwind |
| `packages/types` | `@jortemplate/types` | Tipe dan konstanta bersama API <- -> frontend (CMS, blog, order) |
| `packages/ui` | `@jortemplate/ui` | Button, input, form, card, dan komponen status bersama |
| `packages/utils` | `@jortemplate/utils` | Logger bersama untuk server dan browser |
| `packages/typescript-config` | `@jortemplate/typescript-config` | Konfigurasi TypeScript bersama |

Kode yang dipakai satu app tetap di app tersebut. Kode yang dipakai dua app atau lebih
masuk ke `packages/` dan direferensikan dengan dependency `workspace:*`.

## Mulai

Gunakan Bun 1.2.13+, Node.js 22.12+, dan PostgreSQL. Bun mengelola workspace dan menjalankan
script; tooling Next.js/Vite menggunakan Node.js.

```sh
bun install
cp -n apps/api/.env.example apps/api/.env
cp -n apps/web/.env.example apps/web/.env
cp -n apps/dashboard/.env.example apps/dashboard/.env
```

Di `apps/api/.env`:

- `DATABASE_URL`: database PostgreSQL proyek.
- `ORIGIN`: origin web dan dashboard, dipisah koma.
- `CDN_*`: kredensial bucket Cloudflare R2. Semua field wajib terisi; API tidak start jika ada
  yang kosong. Lihat [storage](storage.md).

Rekening transfer manual diatur di `apps/api/src/config/transfer.json`
(lihat [marketplace](marketplace.md)).

### Database

```sh
bun run --cwd apps/api db:migrate   # membuat tabel dari src/db/migrations
bun run --cwd apps/api db:seed      # mengisi data contoh dari src/db/seed/data.sql
```

Seed berisi akun admin, konten CMS, 18 artikel blog, contoh lead, dan contoh order. Jalankan
pada database kosong; seed berjalan dalam satu transaksi dan gagal tanpa mengubah data jika
data sudah ada. Session login tidak ikut di-seed.

Seed ditujukan untuk development. Data seed memuat hash password admin development dan
data lead/order contoh; jangan dipakai apa adanya di production.

Untuk memperbarui seed dari database lokal (gunakan `pg_dump` yang versinya sama dengan server):

```sh
pg_dump "$DATABASE_URL" --data-only --column-inserts --no-owner --no-privileges \
  -n public -T sessions -f apps/api/src/db/seed/data.sql
```

Setelah mengubah schema di `apps/api/src/db/schemas`, buat migration baru dengan
`bun run --cwd apps/api db:generate`, lalu jalankan `db:migrate`.

### Menjalankan

```sh
bun run dev
```

- API: `http://localhost:8080`
- Web: `http://localhost:3000` (Next.js memilih port berikutnya jika sedang dipakai)
- Dashboard: `http://localhost:5678`

Untuk menjalankan satu app: `bun run dev:api`, `bun run dev:web`, atau `bun run dev:dashboard`.
Origin dashboard harus masuk `ORIGIN` API. Gunakan hostname yang sama untuk cookie session.

## Fitur

### Web (`apps/web`)

| Route | Isi |
| --- | --- |
| `/`, `/home` | Landing dari versi CMS aktif: hero, testimonial, FAQ, dan form lead capture |
| `/blog`, `/blog/[slug]` | Daftar artikel terbit dengan pagination dan detail artikel |
| `/products`, `/products/[slug]` | Katalog marketplace, filter kategori, detail, paket Basic/Pro/Business |
| `/cart`, `/checkout` | Keranjang persisten dan checkout transfer manual dengan upload bukti |
| `/components` | Preview shared UI |

UTM disimpan selama sesi tab dan ikut terkirim bersama lead/order. Event `cta_click`,
`view_item`, `add_to_cart`, dan `begin_checkout` masuk ke `dataLayer`.

### Dashboard (`apps/dashboard`)

| Route | Isi |
| --- | --- |
| `/login` | Login admin (session cookie) |
| `/cms` | Editor section landing dengan live preview, draft/publish, riwayat dan aktivasi versi |
| `/blog` | CRUD artikel, editor, preview, upload gambar |
| `/leadcapture` | Daftar lead beserta atribusi campaign |
| `/orders` | Daftar order, bukti transfer, terima/tolak pembayaran, atribusi campaign |

### API (`apps/api`, prefix `/api/v1`)

| Modul | Endpoint publik | Endpoint admin |
| --- | --- | --- |
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/session` | — |
| CMS | `GET /cms/published` | editor, draft, publish, riwayat, aktivasi versi |
| Blog | `GET /blog/published`, `/blog/published/:slug` | CRUD `/blog` |
| Lead capture | `POST /forms/leadcapture` | `GET /forms/leadcapture` |
| Order | buat order, cek status, upload bukti, batal, inventory | daftar, detail, bukti, review |
| Upload | — | `POST /uploads/image`: upload gambar ke R2 |
| User | — | CRUD `/users` |

Endpoint publik yang menerima input memakai pembatasan request dan batas ukuran body.

## Validasi

```sh
bun run typecheck
bun run check:api
bun run build
```

API berjalan langsung dengan Bun, sehingga `build` hanya membangun web dan dashboard.
Folder dan script tes tidak disertakan; metode dan hasil pengujian dicatat di dokumen fitur.

Web production: `bun run --cwd apps/web start`.
API production: `bun run --cwd apps/api start`; migration production: `bun run --cwd apps/api db:migrate:prod`.
Dashboard menghasilkan `apps/dashboard/dist`; hosting SPA perlu fallback route ke `index.html`.
Set `VITE_API_URL` saat build dashboard, `NEXT_PUBLIC_API_URL` untuk web, dan `ORIGIN` pada API.
Cookie API memakai `SameSite=Lax`, jadi frontend dan API ditempatkan pada site yang sama.

Docker belum disesuaikan untuk shared workspace.

## Dokumentasi

- Fitur: [CMS](cms.md), [blog](blog.md), [lead capture](forms.md),
  [marketplace dan pembayaran](marketplace.md), [marketing](marketing/README.md).
- Infrastruktur: [storage R2](storage.md), [upload gambar](uploads.md).
- Shared package: [UI](shared_ui.md), [utils/logger](shared_utils.md).
- [Spesifikasi teknis](important/SPEC.md) dan [catatan penggunaan AI](important/AI_LOGS.md).


- **Pertanyaan:** hendrawan.putra@dsg.id
- **Kirim ke:** recruitment@dsg.id (cc: hendrawan.putra@dsg.id, rochman.maarif@dsg.id)
