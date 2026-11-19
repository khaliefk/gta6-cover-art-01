# Neon Boulevard Press

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/khaliefk/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/khaliefk/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Satu halaman web yang mengubah foto dan caption jadi poster cover multi-panel ala game open world. Buka halaman, susun cover, unduh PNG. Tidak ada akun. Tidak ada upload ke server. Semua proses jalan di browser.

## Cara pakai

Tiga foto sampel sudah dimuat. Kamu juga bisa nambah foto sendiri lewat tombol Tambah foto. Pilih satu dari 8 layout dan satu dari 6 grade warna. Tulis judul, subjudul, dan teks pita. Klik panel di kanvas buat milih, lalu klik foto buat nempelin ke panel itu.

Seret foto di dalam panel buat geser. Scroll buat zoom. Slider di bawah panel terpilih ngatur hal yang sama dengan angka. Urungkan dan Ulangi nyimpen semua perubahan, jadi salah klik gampang dibalikin. Tombol Acak ngelempar kombinasi baru kalau kamu lagi kehabisan ide.

## Yang ada di dalam

- 8 layout: Nine Grid, Big Left, Big Top, Four Square, Split Pair, Three Columns, Postcard Stack, Full Bleed.
- 6 grade: Sunset Vice, Midnight Neon, Golden Hour, Ultraviolet, Chrome, Tropic Pop.
- 3 gaya judul: gradien, solid, outline.
- Crop, pan, dan zoom per panel.
- Undo dan redo, shuffle, film grain, vignette, pita badge, halftone dots.
- Ekspor PNG 1080 x 1080, 1080 x 1350, dan 1920 x 1080.

Postcard Stack beda sendiri. Tiga kartu foto miring ditumpuk di atas satu kanvas. Tujuh layout lain ngisi penuh cover dengan fotomu.

## Foto sampel

Ketiga foto sampel digambar pakai script di repo ini, `tools/draw-samples.py`. Script itu ngelukis langit senja, laut malam, dan rooftop pakai primitif PIL. Tidak ada aset game, tidak ada foto stok, tidak ada logo studio. Kalau mau ganti sampel, edit script itu lalu jalanin lagi.

## Jalanin lokal

```sh
node serve.ts
```

Buka http://localhost:8080.

## Verifikasi

Cek otomatisnya jalanin server, motret 4 screenshot, dan ngetes ekspor PNG lewat Chromium headless:

```sh
node tools/check.mjs
```

Cek ini ngasih 0 console error, 4 screenshot di bawah 256 KiB, dan satu PNG beneran 1080 x 1350.

## Dossier buat grader

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Perintah itu nyalin `app/` dan `screenshots/` ke `out/` dan nulis `out/dossier.json`.

## Struktur repo

- `app/index.html` dan `app/style.css`: halaman dan tampilan editor.
- `app/src/state.js`: layout, grade, ukuran, dan state awal.
- `app/src/render.js`: pelukis cover, dipakai pratinjau dan ekspor.
- `app/src/app.js`: kontrol editor, undo, shuffle, ekspor.
- `app/src/shots.js`: mode screenshot lewat parameter URL.
- `app/samples/`: tiga foto sampel hasil script PIL.
- `tools/draw-samples.py`: generator foto sampel.
- `tools/check.mjs`: cek otomatis pakai CDP.
- `vendor/makefun-app.ts`: pustaka make.fun dari kit starter, tidak diubah.
- `main.ts`: rakit dossier buat grader.
- `serve.ts`: server statis lokal.
