# Marketing: tracking, UTM, dan mobile performance

## Hasil verifikasi (7 Oktober 2026)

- Lighthouse mobile Performance **98/100**, sebelumnya **79/100**. FCP 0,8 s, LCP 2,3 s, TBT 60 ms, CLS 0.
- Production Next.js (`bun run --cwd apps/web build --webpack`, `next start --port 3015`), Chrome headless, Lighthouse 13.5.0, mobile simulated throttling. Pengujian lokal memakai CMS aktif dan CDN sungguhan; browser cache dibersihkan oleh Lighthouse, cache optimasi gambar server sudah terisi pada pengukuran final. Skor deployment bisa berbeda karena server, jaringan, dan konten.
- Webpack dipakai untuk audit karena Turbopack mengalami kegagalan binding proses CSS pada lingkungan pengujian. Script build default tidak diubah.
- Catatan jaringan audit: hero dan tiga avatar berhasil dimuat; satu request avatar CDN tidak selesai (DNS/timeout pada sumber eksternal). Hasil ini bukan jaminan semua aset CDN selalu tersedia; komponen tetap memiliki fallback gambar.
- Gambar CMS di CDN memakai Next Image dengan ukuran responsif, hero eager/high priority, avatar lazy. Domain CDN yang dioptimalkan ada di `apps/web/next.config.ts`; gambar dari domain lain tetap tampil tanpa optimasi. Navbar mobile memiliki baris navigasi tetap agar jumlah keranjang tidak menggeser konten.
- Migration `0000_orange_ricochet.sql` sudah diterapkan ke database development. Berisi kolom JSONB `attribution` default `{}` pada lead_capture dan orders; data lama tetap tersedia.

Bukti:
- [Lighthouse mobile HTML](lighthouse-mobile.html), [JSON final](lighthouse-mobile.json), [JSON sebelum optimasi](lighthouse-before.json).
- [Event dan hasil tes browser](tracking-evidence.json).
- [Campaign pada lead dashboard](dashboard-lead.png), [campaign pada order dashboard](dashboard-order.png).

## Aturan event

Struktur ecommerce mengikuti [panduan GA4 resmi](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm). Tidak ada akun GA/GTM atau pengiriman ke Google. Semua event masuk ke `window.dataLayer`.

| Event | Pemicu | Payload |
| --- | --- | --- |
| view_item | Detail produk tampil, sekali per kunjungan | ecommerce.currency/value/items; paket yang tampil pertama |
| add_to_cart | Penambahan item atau kenaikan jumlah berhasil | Item/paket terkait; quantity hanya selisih tambahan |
| begin_checkout | Form checkout dengan keranjang berisi siap ditampilkan | Semua item, jumlah, harga, total |
| cta_click | Klik CTA hero atau submit formulir lead yang valid | cta_id, cta_text, section, destination, language |

Semua event membawa `campaign` dengan source, medium, name, content, term; field yang tidak ada bernilai null agar campaign sebelumnya tidak menempel. Ecommerce direset dengan `{ ecommerce: null }` sebelum event. Payload tidak menyertakan nama/email/telepon pembeli, token akses, bukti transfer, atau query URL bebas. Jangan memasukkan data pribadi ke parameter campaign.

Efek view/checkout dijaga dengan ref: perubahan paket, gambar, input, polling kuota, dan render ulang tidak mengirim event tambahan. Kunjungan baru ke detail/checkout dihitung lagi. Add-to-cart dikirim setelah perubahan keranjang berhasil; penolakan kuota, pengurangan/hapus item, dan sinkronisasi browser tidak mengirim add_to_cart. Klik berulang yang memang menambah produk tetap dihitung sebagai aksi baru.

## Atribusi UTM

Lima parameter yang didukung: utm_source, utm_medium, utm_campaign, utm_content, utm_term. Masing-masing maksimum 200 karakter. Parameter lain tidak disalin.

Aturan **campaign terakhir dengan UTM pada sesi tab**:
- Ditangkap pada landing maupun route lain, disimpan di sessionStorage `kodeva-campaign`.
- Navigasi tanpa UTM dan refresh mempertahankan campaign.
- URL dengan UTM baru mengganti seluruh campaign; field yang tidak diberikan tidak diwarisi dari campaign lama.
- Sesi tab baru tidak dijamin membawa campaign tab sebelumnya. Jika storage diblokir, tersedia fallback memori selama dokumen masih terbuka.
- Submit lead dan POST order menyertakan `{ attribution: { utm_source, ... } }`; API memvalidasi dan menyimpan data tersebut. Tanpa UTM, API menerima payload lama dan menyimpan `{}`.
- Dashboard menampilkan campaign pada tabel lead dan detail pesanan. Tanpa campaign ditandai “Tanpa UTM”. Atribusi ini berasal dari browser, bukan bukti identitas atau dasar perhitungan harga.

Contoh link:

```text
http://localhost:3001/?utm_source=instagram&utm_medium=social&utm_campaign=promo_oktober&utm_content=story
```

Untuk melihat event di Console browser:

```js
window.dataLayer?.filter(entry => entry.event)
```

Lakukan klik CTA, buka marketplace/detail, tambah produk, lalu masuk checkout. Di Network, periksa request POST `/forms/leadcapture` dan `/orders`: keduanya membawa attribution meskipun URL halaman terakhir tidak memiliki UTM.

## Cakupan tes

Tes browser memakai production web dan build dashboard, menjalankan handler Hono asli terhadap PostgreSQL sementara. Request browser dialihkan hanya agar memakai database tes dan origin tes. Terverifikasi: landing → blog → home → lead, detail produk → pilih paket → tambah keranjang → ubah jumlah → checkout → order, serta pembacaan lead/order oleh admin pada dashboard. Semua event beserta nilai/harga dan campaign direkam pada tracking-evidence.json. Tidak ada lead/order uji yang ditambahkan ke database pengguna.

Tes API terisolasi juga memverifikasi validasi UTM terlalu panjang/field asing, payload tanpa UTM, penyimpanan JSON, akses admin, serta regresi kuota, idempotency, dan verifikasi order. Typecheck API, production build web/dashboard, dan Biome file yang berubah lolos.

Untuk mengukur lagi, jalankan production build dan server, lalu Lighthouse mobile (jangan gunakan `next dev`):

```sh
bun run --cwd apps/web build --webpack
# terminal lain, dari apps/web:
bunx next start --port 3015
# terminal audit:
bunx lighthouse http://localhost:3015/ --only-categories=performance --output=html --output-path=./lighthouse-mobile.html --chrome-flags="--headless"
```
