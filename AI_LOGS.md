# Catatan penggunaan AI — Kodeva


## Cakupan dan pembagian peran

Catatan ini merangkum pengembangan setelah commit `7f0dd97` — `main: init template setup mono repo`, 6 Oktober 2026. Dasarnya adalah percakapan pengembangan, perubahan working tree terhadap commit tersebut, dan artefak pengujian. Sebagian file baru masih untracked saat log disusun; cakupan tidak hanya berdasarkan `git diff`.

Saya yang menulis kode aplikasi ini serta menetapkan kebutuhan, struktur, prioritas, dan keputusan teknis. AI saya posisikan sebagai reviewer dan rekan diskusi: membaca codebase, menunjukkan bug atau ketidaksesuaian dengan requirement, menjalankan pengujian, serta memberikan opsi beserta trade-off saat saya perlu mengambil keputusan. Saran AI tidak langsung diterima; saya mengevaluasinya melalui kode, penggunaan aplikasi, log, dan screenshot, lalu memutuskan apa yang diterapkan.

Pengecualiannya ada di frontend: AI membantu styling `apps/web` dan `apps/dashboard`. Di frontend saya mengerjakan logic komponen, data fetching, dan state management, sedangkan penulisan styling (class Tailwind, layout, dan responsivitas) banyak dibantu AI berdasarkan arahan tampilan dan screenshot yang saya berikan.

Fondasi monorepo, authentication, logger bersama, dan komponen UI dasar sudah ada pada commit acuan. Log ini tidak mengklaim fondasi tersebut sebagai pekerjaan baru setelah commit terakhir.

| Bagian | Pekerjaan dan keputusan |
| --- | --- |
| Storage R2 | Menambahkan SDK S3 dan helper upload/hapus di API. Kredensial tetap di server. Dashboard memilih file untuk gambar CMS/blog; API mengupload lalu mengembalikan URL. Memeriksa ukuran dan signature file. |
| CMS API | Mengembangkan schema konten dan versi yang terkait admin, DTO, repository, service, serta route mengikuti pola authentication yang sudah ada. Mendukung draft, publish, riwayat versi, dan aktivasi ulang satu versi halaman. |
| CMS web/dashboard | Landing mengambil versi aktif. Dashboard memiliki editor section dan live preview, pengurutan, serta riwayat versi. |
| Lead capture | Memisahkan konfigurasi section CMS dari submission nama/email/WhatsApp. Menambahkan validasi, middleware pembatasan request, form publik, dan daftar lead untuk admin. |
| Blog | Mengembangkan schema/payload, CRUD admin, daftar publik dengan pagination, detail berdasarkan slug, editor dan preview dashboard, serta upload gambar. Mengisi artikel contoh dan memperbaiki keterbacaan detail artikel. |
| Layout dan shared UI | Memindahkan penggunaan styling ke Tailwind pada web, dashboard, dan shared UI. Menambahkan navigasi halaman dan mengganti branding tampilan menjadi Kodeva. Styling `apps/web` dan `apps/dashboard` dikerjakan dengan bantuan AI. |
| Marketplace | Katalog enam produk dari JSON bersama, filter kategori, detail/screenshot, paket Basic/Pro/Business, harga promo, kuota bersama lintas-paket, serta keranjang persisten. Produk belum dikelola melalui dashboard. |
| Pembayaran | Awalnya berupa simulasi frontend sesuai brief. Setelah perubahan scope saya putuskan, ditambahkan order PostgreSQL, transfer manual, upload bukti, persetujuan/penolakan admin, dan download kuitansi PNG. Harga order dihitung API dan disimpan sebagai snapshot. |
| Marketing | Menambahkan event dataLayer, penyimpanan UTM selama sesi tab, validasi dan persistence atribusi pada lead/order, serta tampilan campaign di dashboard. Mengukur dan memperbaiki performa mobile. |


## Tools yang dipakai

| Tool | Penggunaan |
| --- | --- |
| OpenAI Codex | Review codebase, menemukan bug dan celah terhadap requirement, debugging, menjalankan pengujian, menyusun dokumentasi, serta memberi opsi dan trade-off untuk keputusan teknis. |
| Claude Code | Merapikan struktur direktori dashboard (memecah komponen editor/riwayat CMS, hooks, dan CSS) serta menyesuaikan layout dua kolom halaman CMS atas instruksi saya. |
| Terminal melalui RTK, Git, ripgrep | Membaca kode, mencari pemakaian fungsi, memeriksa status/diff dan commit acuan. |
| Bun, Next.js, Vite | Dependency workspace, menjalankan API/frontend, type generation, dan production build. |
| TypeScript dan Biome | Memeriksa kompatibilitas tipe, lint, import, serta format file yang berubah. |
| Drizzle Kit dan PostgreSQL | Membuat/menerapkan migration dan menguji persistence, transaksi, kuota, serta konflik perubahan. Tes integrasi memakai PostgreSQL sementara yang terisolasi. |
| curl dan request Hono | Menguji endpoint, status HTTP, respons, CORS, serta otorisasi. Pengujian live sebelumnya menggunakan API lokal yang saya siapkan. |
| Python dan skrip TypeScript sementara | Menyiapkan runner database tes, fixture, pemeriksaan hasil, dan otomasi pengujian tanpa menambah direktori test permanen di proyek. |
| Playwright dan Chrome headless | Menguji navigasi, form, event browser, payload checkout, dan tampilan atribusi dashboard. |
| Lighthouse | Mengukur Performance mobile pada production build serta menghasilkan laporan HTML/JSON. |
| Dokumentasi resmi Next.js dan GA4 | Memeriksa perilaku framework yang terpasang, optimasi gambar, dan bentuk payload ecommerce dataLayer. |

SDK AWS S3 digunakan oleh aplikasi untuk mengakses Cloudflare R2. Pada tes regresi order, R2 dimock; hasil tes tersebut bukan bukti integrasi bank atau payment gateway sungguhan.

## Tiga contoh prompt yang membantu

Contoh berikut diringkas dari instruksi saya selama pengembangan, bukan transkrip verbatim.

1. **“Review service CMS di `apps/api/src/services/cms`, bandingkan dengan pattern service authentication yang sudah ada.”**
   Saya memberikan acuan kode agar review mengukur kesesuaian pemisahan DTO, repository, dan service, bukan selera gaya penulisan.

2. **“Untuk upload gambar CMS dan blog, saya mau user pilih file langsung dan API yang mengirim ke R2. Apa risiko dan trade-off-nya?”**
   Prompt ini saya pakai untuk menguji keputusan desain sebelum menulis kode. Keputusannya: pemilih file menggantikan keharusan menempel URL, sementara credential R2 tetap hanya digunakan di API.

3. **“Verifikasi kebutuhan marketing end-to-end: Lighthouse mobile minimal 80, empat event dataLayer tanpa duplikasi re-render, dan UTM tetap ikut lead/order setelah pindah halaman.”**
   Saya menetapkan acceptance criteria yang dapat diukur. AI menguji alur browser sampai database/dashboard, merekam event, dan menjalankan Lighthouse untuk membuktikan apakah implementasi saya memenuhi target.

## Contoh hasil AI yang kurang tepat dan koreksinya

### 1. Rekomendasi konfigurasi pembayaran terlalu membatasi alur development

- **Masalah:** Rekomendasi awal AI mensyaratkan `privateBucket` khusus yang berbeda dari bucket CDN. Setelah saya mengisi rekening dan mengaktifkan transfer, checkout masih menampilkan bahwa konfigurasi belum siap.
- **Ditemukan melalui:** Screenshot tombol checkout yang disabled dan pemeriksaan `transfer.json` terhadap validator `transfer.ts`.
- **Koreksi:** Saya memutuskan memakai bucket development yang sudah ada. Kewajiban `privateBucket` dihapus dan upload bukti menggunakan `env.CDN_BUCKET` dengan prefix `payment-proofs/`. Nilai rekening yang saya isi tetap dipertahankan.
- **Verifikasi:** Typecheck dan Biome lolos; pemeriksaan konfigurasi menghasilkan `enabled: true`. Saya kemudian mencoba alur pembayaran sampai pesanan berstatus Lunas. Saat proses hot reload API sempat memberi respons kosong, AI menyampaikan perlunya restart, bukan menyatakan request live sudah sukses.
- **Batas keputusan:** Ini penyesuaian kebutuhan development. Bucket publik tetap memungkinkan objek diakses melalui URL langsung; autentikasi endpoint API tidak membuat bucket tersebut privat. Konsekuensi ini dicatat di dokumentasi marketplace.

### 2. Implementasi gambar landing belum memenuhi target performa

- **Masalah:** Gambar CMS awalnya menggunakan `unoptimized`, sehingga browser menerima gambar ukuran asli. Lighthouse mobile pertama hanya **79**, di bawah target **80**, dengan total transfer halaman sekitar 2,7 MB dan LCP 5,3 detik.
- **Ditemukan melalui:** Audit Lighthouse yang dijalankan AI pada production build, bukan perkiraan dari tampilan atau pengukuran development server.
- **Koreksi:** Saya mengaktifkan optimasi Next Image untuk domain CDN, menambahkan ukuran responsif, memprioritaskan hero, dan mempertahankan lazy loading avatar. Audit berikutnya juga mengungkap pergeseran navbar saat jumlah keranjang dimuat; baris navigasi mobile kemudian saya buat tetap.
- **Verifikasi:** Pengukuran final menghasilkan **98**, LCP **2,3 detik**, TBT **60 ms**, dan CLS **0**. Hero yang dimuat sekitar 24 KB. Bukti sebelum/sesudah tersedia dalam [laporan marketing](../marketing/README.md).
- **Batas hasil:** Pengujian dilakukan lokal dengan simulated mobile throttling dan cache optimasi gambar server sudah terisi. Satu request avatar mengalami masalah DNS/timeout. Angka ini bukan jaminan skor yang sama pada semua jaringan/deployment.

### 3. Saran tipe atribusi UTM dari AI belum kompatibel

- **Masalah:** Schema Zod yang disarankan AI menghasilkan properti `string | undefined`, sedangkan tipe shared memakai optional property dengan `exactOptionalPropertyTypes`. Kode yang tampak sesuai secara struktur ternyata gagal pada DTO dan insert Drizzle.
- **Ditemukan melalui:** `bun run --cwd apps/api typecheck`, yang melaporkan ketidakcocokan output DTO dengan tipe input lead/order.
- **Koreksi:** Saya menambahkan normalisasi output atribusi: hanya pasangan key/value string yang terisi dipertahankan; nilai absent tidak disimpan sebagai properti `undefined`. Payload tanpa atribusi dinormalisasi menjadi `{}`.
- **Verifikasi:** Typecheck API lolos. Tes PostgreSQL terisolasi memastikan UTM tersimpan pada lead dan order, payload tanpa UTM diterima, serta field asing/nilai melebihi 200 karakter ditolak. Tes browser memastikan atribusi akhirnya tampil pada dashboard.

## Bagian yang paling banyak melibatkan AI dan edge case yang diuji

### Order, harga, dan kuota promo bersama

Saya menetapkan dan mengimplementasikan alur order, aturan harga, kuota, dan proses verifikasi admin. AI paling banyak berperan di bagian ini sebagai reviewer: menelusuri repository/service order, transaksi, serta integrasi checkout dan dashboard untuk mencari celah, lalu menjalankan pengujian berikut. Temuan review saya evaluasi sebelum diterapkan, termasuk keputusan menyederhanakan scope.

| Edge case | Hasil yang diverifikasi |
| --- | --- |
| Produk sama dengan paket berbeda | Basic dan Pro tetap menghabiskan kuota produk yang sama. Total lisensi antarbaris dihitung bersama. |
| Dua checkout berebut sisa kuota | Transaksi dengan advisory lock membuat satu request berhasil dan request lain mendapat konflik; kuota tidak terjual berlebihan. |
| Browser mengirim total buatan sendiri | Field total dari client ditolak; API menentukan harga berdasarkan katalog. |
| Request checkout dikirim ulang | Token dan payload sama mengembalikan order yang sama. Payload berbeda pada token yang sama menghasilkan konflik. |
| Orang lain mencoba membaca order/bukti | Token pembeli yang salah ditolak; endpoint admin memerlukan sesi dan role admin. |
| File palsu atau R2 gagal | Konten gambar tidak valid ditolak. Kegagalan upload tidak mengubah pesanan menjadi menunggu verifikasi. R2 dimock pada tes ini. |
| Dua admin memverifikasi versi yang sama | Pemeriksaan status dan timestamp membuat keputusan kedua yang sudah kedaluwarsa ditolak dengan konflik. |
| Bukti ditolak, upload ulang, atau pesanan kedaluwarsa | Alasan penolakan wajib, upload ulang tersedia sesuai status, dan expiry/cancel melepaskan kuota. |

### Marketing dari browser sampai database

Saya mengembangkan fitur marketing berdasarkan kebutuhan tracking, UTM, dan performa mobile yang sudah ditentukan. Untuk verifikasi, AI menjalankan production web/build dashboard dengan handler Hono asli dan PostgreSQL sementara. Request browser diarahkan ke database tes agar pengujian tidak menambah lead/order pada database pengguna.

- Campaign Instagram tetap terbawa melalui landing → blog → home → submit lead.
- Memilih paket atau screenshot tidak menggandakan `view_item`; kunjungan baru ke detail mencatat view baru.
- Tambah ke keranjang dan kenaikan jumlah masing-masing mencatat `add_to_cart` dengan quantity tambahan, bukan total keranjang.
- Mengisi input checkout dan berpindah ke status pembayaran tidak menggandakan `begin_checkout`.
- Payload checkout menyertakan UTM, order menyimpannya, dan dashboard membacanya melalui endpoint admin.
- Campaign TikTok baru mengganti campaign Instagram, termasuk menghapus field lama yang tidak ada pada campaign baru; refresh tanpa UTM mempertahankan campaign terakhir.

Hasil dan contoh payload ada di [tracking-evidence.json](../marketing/tracking-evidence.json). Event analytics saat ini hanya masuk ke `dataLayer`; belum dikirim ke akun Google Analytics atau disimpan sebagai statistik pengunjung di backend.

## Bagian yang saya kerjakan sendiri tanpa AI

Saya mengisi sendiri **konfigurasi development**, yaitu nilai environment R2 di `apps/api/.env`, serta nilai rekening percobaan dan `enabled` di `apps/api/src/config/transfer.json`. Setelah konfigurasi tersedia, saya meminta AI mereview integrasinya terhadap validator dan pemakaian konfigurasi di kode.

Alasannya, nilai konfigurasi harus berasal dari lingkungan dan keputusan saya, bukan tebakan AI. Saya juga menyediakan gambar uji, menjalankan aplikasi/migration pada tahap yang saya konfirmasi, mencoba UI, serta mengirim log dan screenshot sebagai bahan evaluasi. Credential dan nilai rahasia tidak disalin ke log ini.

Pemisahan kontribusinya: penulisan kode fitur, konfigurasi lingkungan, evaluasi manual, dan keputusan akhir saya kerjakan sendiri; AI berperan pada review, pengujian, dokumentasi, pertimbangan keputusan, dan styling `apps/web` serta `apps/dashboard`, ditambah bagian yang secara eksplisit dicatat pada tabel tools di atas.

## Bukti dan batas verifikasi

- [CMS](../cms.md), [hasil hit CMS](../cms-live-result.json).
- [Lead capture](../forms.md), [hasil hit form](../forms-live-result.json).
- [Blog](../blog.md), [hasil hit blog](../blog-live-result.json), [batch artikel contoh](../blog-batch-result.json).
- [Upload gambar](../uploads.md) dan [marketplace/order](../marketplace.md).
- [Marketing dan metode pengujian](../marketing/README.md), [Lighthouse HTML](../marketing/lighthouse-mobile.html), [contoh event](../marketing/tracking-evidence.json).
- [Campaign lead di dashboard](../marketing/dashboard-lead.png), [campaign order di dashboard](../marketing/dashboard-order.png).

Pemeriksaan terakhir tahap marketing mencakup typecheck API, production build web/dashboard, Biome pada file yang berubah, tes integrasi, dan tes browser. Ini tidak sama dengan audit keamanan menyeluruh atau jaminan bebas bug. Skrip pengujian sementara berada di luar direktori proyek; laporan hasil yang disimpan di repository dirujuk di atas. Dokumen fitur dari tahap sebelumnya mungkin memuat status historis; hasil marketing dan pembayaran terbaru dijelaskan pada dokumen masing-masing.
