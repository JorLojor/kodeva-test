# Spesifikasi teknis — Kodeva

Dokumen ini merangkum konfigurasi repository pada 7 Oktober 2026. Versi package pada tabel adalah **rentang versi di `package.json`**; versi hasil instalasi dikunci oleh `bun.lock`.

## Asal codebase

Saya menggunakan codebase milik saya yang sudah tersedia sebagai fondasi repository ini. Fondasi tersebut digunakan kembali dan dikembangkan untuk memenuhi kebutuhan Kodeva, termasuk CMS, blog, lead capture, marketplace, pembayaran manual, dan marketing.

Commit acuan `7f0dd97` (`main: init template setup mono repo`) sudah memuat struktur monorepo, authentication, logger bersama, serta komponen UI dasar. Fitur yang ditambahkan setelah commit tersebut merupakan pengembangan di atas fondasi ini. Penggunaan AI dalam pengembangan dan pengujian dijelaskan pada [AI_LOGS.md](AI_LOGS.md).

## Ringkasan aplikasi

| Workspace | Fungsi | Stack |
| --- | --- | --- |
| `apps/api` | Backend dan akses database/storage | Hono, TypeScript, Bun, PostgreSQL, Drizzle ORM |
| `apps/web` | Website publik, landing, blog, marketplace, dan checkout | Next.js App Router, React, TypeScript, TanStack Query, Tailwind CSS |
| `apps/dashboard` | Panel admin untuk CMS, blog, lead, dan pesanan | React SPA, Vite, React Router, TypeScript, TanStack Query, Tailwind CSS |

Brand tampilan menggunakan **Kodeva**. Nama root package masih `jortemplate` dan nama workspace masih memakai scope `@jortemplate/*`.

## Pendekatan monorepo

Repository memakai **Bun Workspaces**, dengan pola `apps/*` dan `packages/*` di root `package.json`. Package manager yang dideklarasikan adalah `bun@1.2.13`. Satu `bun.lock` mengunci dependency seluruh workspace.

```text
apps/
  api/                  Backend Hono
  web/                  Website Next.js
  dashboard/            Dashboard React/Vite
packages/
  ui/                   Komponen React dan tema bersama
  types/                Kontrak tipe data bersama
  utils/                Logger dan katalog marketplace bersama
  typescript-config/    Konfigurasi TypeScript bersama
```

- Dependency internal menggunakan `workspace:*`, misalnya `@jortemplate/ui` dan `@jortemplate/types`.
- Kode yang digunakan lebih dari satu app dapat diletakkan di `packages/`. Kode khusus satu app tetap berada di app tersebut; helper R2 dan repository database berada di API.
- Shared package mengekspor source TypeScript secara langsung, tanpa langkah build package terpisah. Next.js mentranspilasi `@jortemplate/utils` dan `@jortemplate/ui` melalui `transpilePackages`; Vite/Bun memproses dependency workspace sesuai kebutuhan masing-masing.
- Ketiga app dapat dijalankan atau dibangun secara terpisah. Root script mengoordinasikan script workspace lewat Bun `--filter` dan `--cwd`.
- Tidak menggunakan Turborepo, Nx, atau layanan build cache monorepo tambahan.
- Komunikasi web/dashboard dengan API menggunakan HTTP JSON dan multipart untuk upload. Frontend tidak mengakses PostgreSQL atau credential R2 secara langsung.

## `apps/api`

Package: `@jortemplate/api`. Runtime Bun menjalankan source TypeScript langsung melalui `Bun.serve`. Development memakai `bun run --hot src/index.ts`; startup production memakai `NODE_ENV=production bun run src/index.ts`.

### Package utama

| Package | Versi manifest | Kegunaan |
| --- | --- | --- |
| `hono` | `^4.13.3` | Routing HTTP dan middleware |
| `drizzle-orm` | `^0.45.3` | Schema, query, relasi, dan transaksi database |
| `postgres` | `^3.4.9` | Driver PostgreSQL untuk Drizzle |
| `zod` | `^4.1.5` | Validasi environment dan request DTO |
| `dotenv` | `^17.2.2` | Membaca konfigurasi environment |
| `@aws-sdk/client-s3` | `^3.1146.0` | Akses Cloudflare R2 melalui API kompatibel S3 |
| `file-type` | `^22.1.1` | Identifikasi signature konten file upload |
| `@jortemplate/utils` | `workspace:*` | Logger server dan katalog marketplace |
| `@jortemplate/types` | `workspace:*` | Kontrak payload dan respons bersama |

Tool development: TypeScript `^5.9.2`, Drizzle Kit `^0.31.11`, Biome `2.5.15`, dan `@types/bun` dengan versi manifest `latest`.

### Struktur dan perilaku

- Pattern modul: **route → service → repository**. DTO Zod memvalidasi input; repository mengakses database dan mengembalikan `RepositoryResult`; service memakai `BaseService` untuk respons dan penanganan error.
- Endpoint aplikasi berada di `/api/v1`. Modulnya mencakup health, authentication, user management, CMS, blog, forms, uploads, dan orders.
- Database PostgreSQL memiliki tabel `user`, `sessions`, `content`, `content_changes_log`, `lead_capture`, `blog`, dan `orders`. Payload konten, item order, dan atribusi campaign menggunakan JSONB pada bagian yang membutuhkan struktur fleksibel.
- Migration disimpan di `src/db/migrations` dan dikelola Drizzle Kit.
- Authentication admin menggunakan session access/refresh token dalam cookie HTTP-only. Hash token disimpan di database; password menggunakan API password Bun. Akses admin diperiksa melalui middleware role.
- Middleware meliputi request ID, structured request logging, secure headers, CORS dengan daftar origin eksplisit, pemeriksaan Origin/CSRF untuk mutasi, body limit, dan limiter publik/login pada endpoint terkait.
- Order guest menggunakan token akses melalui header Bearer; pemeriksaan status dan versi melindungi perubahan order dari konflik. Transaksi dan advisory lock PostgreSQL menjaga kuota promo bersama.
- Environment wajib divalidasi saat startup. Koneksi database dan credential S3/R2 tetap di server.
- Storage gambar CMS/blog menggunakan bucket CDN. Bukti transfer development memakai `CDN_BUCKET` yang sama dengan prefix `payment-proofs/`. Konfigurasi rekening dan aktivasi transfer berada di `src/config/transfer.json`.

## `apps/web`

Package: `@jortemplate/web`. Framework Next.js dengan App Router di `src/app`, komponen React, dan TypeScript.

### Package utama

| Package | Versi manifest | Kegunaan |
| --- | --- | --- |
| `next` | `^16.0.0` | Routing berbasis file, server rendering, dan optimasi gambar |
| `react`, `react-dom` | `^19.2.0` | UI dan rendering React |
| `@tanstack/react-query` | `^5.104.1` | Fetch, cache, mutation, dan sinkronisasi data server |
| `tailwindcss` | `^4.0.0` | Styling utility dan tema bersama |
| `@tailwindcss/postcss` | `^4.0.0` | Integrasi Tailwind dengan build Next.js |
| `postcss` | `^8.0.0` | Pemrosesan CSS |
| `@jortemplate/ui` | `workspace:*` | Komponen dan token tema |
| `@jortemplate/utils` | `workspace:*` | Logger browser dan katalog produk |
| `@jortemplate/types` | `workspace:*` | Tipe CMS, blog, lead, order, dan UTM |
| `@jortemplate/typescript-config` | `workspace:*` | Konfigurasi TypeScript React |

Tool development: TypeScript `^5.9.2`, `@types/node` `^22`, serta `@types/react` dan `@types/react-dom` `^19`.

### Rendering, state, dan fitur

- Landing melakukan prefetch CMS di server dan hydration melalui TanStack Query; halaman publik mengambil konten aktif dari API.
- State server menggunakan TanStack Query. State lokal seperti bahasa, paket terpilih, input form, dan preview menggunakan hook React.
- Keranjang memakai React Context dan `localStorage`; kuota dibaca ulang dari API. UTM disimpan di `sessionStorage` selama sesi tab dan disertakan pada submission lead/order.
- Fetch wrapper berada di `src/lib/api.ts`. Origin API dikonfigurasi melalui `NEXT_PUBLIC_API_URL`.
- Routing utama: `/`, `/home`, `/blog`, `/blog/[slug]`, `/products`, `/products/[slug]`, `/cart`, dan `/checkout`. `/product` mengarahkan ke marketplace; `/components` menampilkan contoh shared UI.
- Marketplace memiliki filter kategori, pilihan paket, screenshot, harga promo, kuota bersama, keranjang persisten, dan transfer manual dengan verifikasi admin.
- Kuitansi pembayaran Lunas dapat diunduh sebagai PNG melalui Canvas browser, tanpa library PDF.
- `next/image` mengoptimalkan gambar dari domain CDN yang diizinkan pada `next.config.ts`, dengan ukuran responsif dan prioritas hero. Gambar CMS dari domain lain menggunakan jalur tanpa optimasi.
- Event `view_item`, `add_to_cart`, `begin_checkout`, dan `cta_click` dikirim ke `window.dataLayer`. Belum ada akun GA/GTM atau pengumpulan event analytics di backend.

Build default memakai `next build`; mode bundler default mengikuti Next.js yang terpasang. Audit marketing menggunakan `next build --webpack` karena kendala Turbopack pada lingkungan pengujian, tanpa mengganti script build default.

## `apps/dashboard`

Package: `@jortemplate/dashboard`. Aplikasi React SPA dengan Vite dan routing client-side.

### Package utama

| Package | Versi manifest | Kegunaan |
| --- | --- | --- |
| `react`, `react-dom` | `^19.2.0` | UI React |
| `react-router-dom` | `^7.9.0` | Routing halaman SPA |
| `@tanstack/react-query` | `^5.90.0` | Session, data admin, cache, mutation, dan invalidasi query |
| `vite` | `^7.0.0` | Development server dan production bundler |
| `@vitejs/plugin-react` | `^5.0.0` | Integrasi React pada Vite |
| `tailwindcss` | `^4.0.0` | Styling utility |
| `@tailwindcss/vite` | `^4.0.0` | Integrasi Tailwind pada Vite |
| `@jortemplate/ui` | `workspace:*` | Komponen dan tema yang sama dengan web |
| `@jortemplate/utils` | `workspace:*` | Logger browser |
| `@jortemplate/types` | `workspace:*` | Kontrak data bersama |
| `@jortemplate/typescript-config` | `workspace:*` | Konfigurasi TypeScript React |

Vite, plugin React/Tailwind, dan shared TypeScript config berada dalam `devDependencies`. Tool tipe lainnya: TypeScript `^5.9.2`, `@types/node` `^22`, serta tipe React/React DOM `^19`.

### Struktur dan fitur

- Entry point di `src/main.tsx`, provider di `src/app/providers.tsx`, routing di `src/app/App.tsx`, halaman di `src/pages`, dan logic fitur di `src/features`.
- TanStack Query mengelola data server; hook React mengelola draft editor, preview, pilihan tab, dan state form lokal.
- Session diperiksa sebelum halaman admin dibuka. Request API menyertakan cookie dengan `credentials: include`.
- API origin memakai `VITE_API_URL`; wrapper request berada di `src/lib/api.ts`.
- Halaman: login, CMS editor/live preview/riwayat, blog editor/preview, daftar lead, serta daftar/detail/verifikasi pesanan. Menu Product masih halaman placeholder.
- Campaign ditampilkan pada tabel lead dan detail order.
- Build menjalankan typecheck kemudian Vite; hasilnya berada di `dist`. Hosting SPA perlu fallback route ke `index.html`.

## Shared packages

### `packages/ui` — `@jortemplate/ui`

Komponen React bersama: Button, Input, Textarea, FormField, Label, Card, Badge, Alert, dan EmptyState. Export utama melalui `src/index.ts`; tema diekspor sebagai `@jortemplate/ui/styles.css`.

Menggunakan `tailwind-merge` `^3.0.0` untuk penggabungan class. React `^19.2.0` dan Tailwind `^4.0.0` menjadi peer dependency. Warna, font, border, dan focus token didefinisikan melalui `@theme`; `@source` membuat class komponen ikut diproses oleh Tailwind app.

### `packages/types` — `@jortemplate/types`

Kontrak TypeScript untuk CMS, blog, lead capture, order, bahasa `idn`/`eng`, dan campaign attribution. Package ini mengekspor `src/index.ts` tanpa dependency runtime. Validasi request tetap dilakukan API dengan Zod; tipe TypeScript tidak menggantikan validasi runtime.

### `packages/utils` — `@jortemplate/utils`

- `logger/`: logger bersama menggunakan `pino` `^10.3.1` dan `pino-pretty` `^13.1.3`. Conditional export menyediakan implementasi browser dan server melalui `@jortemplate/utils/logger`.
- `marketplace/`: katalog JSON bersama yang diekspor melalui `@jortemplate/utils/marketplace`. Web menggunakan katalog untuk tampilan dan API untuk perhitungan harga/kuota. Produk masih bersumber dari JSON, sedangkan pesanan tersimpan di database.

### `packages/typescript-config` — `@jortemplate/typescript-config`

Mengekspor `base.json` dan `react.json`. Konfigurasi dasar menggunakan strict mode, module resolution Bundler, JSON imports, `noEmit`, dan `noUncheckedIndexedAccess`. Konfigurasi React menambahkan library DOM dan JSX.

Web, dashboard, UI, dan utils memakai konfigurasi bersama sesuai tsconfig masing-masing. API memiliki tsconfig sendiri dengan tipe Bun dan aturan tambahan seperti `exactOptionalPropertyTypes`, `noUnusedLocals`, serta `noImplicitReturns`. Alias `@/*` tersedia pada API dan web untuk source masing-masing.

## Script dan konfigurasi operasional

| Command dari root | Fungsi |
| --- | --- |
| `bun install` | Instalasi dependency seluruh workspace |
| `bun run dev` | Menjalankan ketiga app lewat filter workspace |
| `bun run dev:api` | API development, port mengikuti environment; konfigurasi contoh 8080 |
| `bun run dev:web` | Next development, port awal 3000; dapat memilih port lain jika terpakai |
| `bun run dev:dashboard` | Vite pada port 5678 dengan `strictPort` |
| `bun run build` | Production build web dan dashboard |
| `bun run typecheck` | Typecheck API, web, dashboard, utils, dan UI |
| `bun run check:api` | Biome check dan typecheck API |
| `bun run --cwd apps/api db:generate` | Generate migration Drizzle |
| `bun run --cwd apps/api db:migrate` | Menerapkan migration |
| `bun run --cwd apps/api db:seed-admin` | Membuat admin dari konfigurasi/flag |

Konfigurasi lokal API berada di `.env`, web di `.env.local`, dan dashboard melalui environment Vite. Nilai publik frontend hanya berupa konfigurasi yang memang boleh diekspos, seperti origin API; credential R2 dan database berada di API.

Biome digunakan untuk lint/format dengan konfigurasi per app dan UI. `.next` dikecualikan dari pemeriksaan web dan `dist` dari dashboard. Repository saat ini tidak memiliki root script test permanen; tes integrasi/browser dan Lighthouse dilakukan melalui alat sementara, dengan hasil tersimpan di dokumentasi.

Playwright, Lighthouse, dan jsdom digunakan sebagai alat pengujian sementara; bukan dependency produksi aplikasi. Docker ditunda dan tidak menjadi bagian dari alur development/build yang dirangkum di sini.

## Dokumentasi fitur

- [CMS](../cms.md), [blog](../blog.md), dan [lead capture](../forms.md).
- [Upload gambar](../uploads.md) dan [marketplace/pembayaran](../marketplace.md).
- [Marketing, metode tes, dan hasil Lighthouse](../marketing/README.md).
- [Catatan penggunaan AI](AI_LOGS.md).
