# Panduan Instalasi — SI-ABSEN SMPN 3 Kediri

Arsitektur: **frontend statis (GitHub Pages)** + **Google Apps Script sebagai REST API** + Google Sheets/Drive sebagai database.

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek baru**.
2. Ganti isi `Code.gs` dengan isi berkas **Kode.gs** (nama berkas boleh tetap `Code`).
3. ⚙️ **Setelan Proyek** → centang **Tampilkan berkas manifes "appsscript.json"** → ganti isinya dengan berkas **appsscript.json**.
4. Pilih fungsi **setupAppEnvironment** → ▶ Run → izinkan akses. **Jalankan sekali** (aman diulang; rahasia tidak ditimpa).
5. Buka **Eksekusi/Execution log** dan **catat sekarang**: (a) akses darurat `darurat / <sandi>`, (b) **token pos absensi**. Keduanya hanya tampil sekali.
6. **Deploy → Deployment baru → Aplikasi web** · Execute as: **Saya** · Akses: **Siapa saja** → salin URL `/exec`.
7. Setelah mengubah kode: **Deploy → Kelola deployment → ✏️ → Versi baru** (jangan buat deployment baru, URL akan berubah).

## B. Rahasia (semua di Script Properties)
| Nilai | Dibuat oleh | Dilihat di |
|---|---|---|
| `SESSION_SECRET`, hash sandi darurat, `POS_TOKEN` | otomatis saat setup | log setup (sekali) |
| `SPREADSHEET_ID`, `ROOT_FOLDER_ID` | otomatis | ⚙️ Setelan Proyek → Script Properties |
| `FONNTE_TOKEN`, `GOOGLE_CLIENT_ID` | Anda, lewat menu **CRM & WA → Konfigurasi** | tampil tersamar (`ABCD••••xyz`) |

Rotasi dari editor: `rotasiSecretSesi()`, `rotasiPosToken()`, `resetAksesDarurat()`. Jangan menambah editor proyek sembarangan dan jangan membagikan spreadsheet database.

## C. Data awal
- Menu **Master Data**: tambah/ubah kelas (jam masuk, toleransi) dan pengguna staf (email Google, peran admin/guru/piket, kelas yang diampu guru). Tidak perlu edit Sheets manual.
- Data siswa: menu **Data Siswa → + Tambah siswa** atau **Impor data lama** (dry-run dulu). PIN awal siswa tampil **sekali** saat disimpan.
- Login Google staf: buat OAuth Client ID (Web) di Google Cloud Console, tambahkan origin `https://USERNAME.github.io`, lalu isi di menu Konfigurasi.

## D. WhatsApp (Fonnte)
Daftar di fonnte.com → hubungkan nomor sekolah (scan QR) → salin token → **CRM & WA → Konfigurasi** → isi token → aktifkan → Simpan. Pesan dikirim lewat antrean (trigger tiap 1 menit), jadi scan tetap instan. Mulai dari blast kecil; beri jeda agar nomor tidak diblokir WhatsApp.

## E. Frontend → GitHub Pages
Folder kerja = **hasil ekstraksi ZIP `si-absen-frontend`** (berisi `index.html` langsung di dalamnya). Folder inilah yang di-`git init`.
1. Ekstrak ZIP. Buka `js/config.js`, ganti `GANTI_DENGAN_ID_DEPLOYMENT` dengan URL `/exec` Anda.
2. Buka terminal **di dalam folder hasil ekstraksi**, pastikan `dir` / `ls` menampilkan `index.html`.
3. Buat repo **Public** kosong di GitHub (jangan centang README), lalu:
```
git init
git add .
git commit -m "SI-ABSEN versi pertama"
git branch -M main
git remote add origin https://github.com/USERNAME/si-absen.git
git push -u origin main
```
(Password = Personal Access Token dengan scope `repo`; tidak ada karakter tampil saat mengetik — normal.)
4. GitHub → Settings → Pages → Branch `main`, folder `/ (root)` → Save. Buka `https://USERNAME.github.io/si-absen/`.
5. Update berikutnya: `git add . && git commit -m "update" && git push`, lalu Ctrl+Shift+R.

## F. Pos absensi & burung 🐦
- Pos: buka situs di tablet gerbang → **Mode Pos Absensi** → tempel token pos → **Mulai Scan**. Gunakan HTTPS (GitHub Pages sudah HTTPS) agar kamera diizinkan.
- Pendaftaran wajah: **Data Siswa → Daftar wajah** (wajib centang persetujuan orang tua). Hanya vektor 128 angka yang disimpan.
- Burung mengikuti kursor/sentuhan; tombol 🐦 di pojok atas untuk menyembunyikannya.

## G. Batasan yang perlu diketahui
- **Update dari versi 1.0:** tempel Kode.gs baru → jalankan `setupAppEnvironment()` sekali lagi (hanya menambah kolom `Link`/`StatusWA`, data tidak berubah) → Deploy versi baru.
- Verifikasi kedipan (liveness) berjalan di browser: menolak foto cetak/layar diam, tetapi **bukan** jaminan penuh terhadap video rekaman. Untuk pos gerbang, tetap awasi dengan petugas piket.
- Surat izin/sakit tersimpan di folder Drive pribadi pemilik script (`Surat Izin Sakit`, tidak dibagikan publik); tautannya ada di kolom `Link` sheet Izin_Sakit.
- Deteksi nomor WA memakai fitur `validate` Fonnte; bila paket Anda tidak menyediakannya, akan muncul pesan jelas dan blast tetap bisa dipakai.
- Kuota GAS: trigger ±90 menit/hari (akun gratis), UrlFetch ±20.000/hari. Uji beban 500–1.000 scan/15 menit sebelum hari-H.
- Data wajah adalah data pribadi spesifik (UU PDP): siapkan persetujuan tertulis dan kebijakan retensi.

## H. Jika muncul halaman "Maaf, saat ini tidak dapat membuka file" (Google Drive)
Itu artinya URL `/exec` tidak dikenali Google. Periksa berurutan:
1. Buka URL `/exec` Anda langsung di tab **Incognito**. Harus tampil `{"success":true,"app":"SI-ABSEN",...}`. Jika tampil halaman Drive tadi → URL salah / deployment dihapus.
2. Salin ulang URL dari **Deploy → Kelola deployment** (jangan dari bilah alamat editor, jangan yang berakhiran `/dev`). Tempel utuh di `js/config.js`, lalu `git add . && git commit -m "url" && git push`.
3. Deployment harus: Execute as **Saya**, Akses **Siapa saja**. Setelah mengubah kode: **Kelola deployment → ✏️ → Versi baru** (bukan deployment baru).
4. Jika masuk dengan beberapa akun Google di browser, URL berbentuk `/macros/u/1/s/…` — hapus bagian `/u/1`.
Situs kini menampilkan pesan penyebab yang spesifik di layar login.
