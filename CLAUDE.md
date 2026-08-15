# FingerSpot Manager — Web App

## Tech Stack
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- API: developer.fingerspot.io

---

## Design Style
- Theme: Dark (#0A0A0F background)
- Style: Liquid Glass / iOS 26 Glass Morphism
- Floating animated glass blocks di background (auth pages)
- Primary color: #1976D2 (electric blue)
- Glass card: background rgba(255,255,255,0.05), backdrop-filter blur(20px), border 1px solid rgba(255,255,255,0.1)
- Font: Inter
- Border radius: cards 16px, inputs 12px, buttons 12px
- Status badge success: background rgba(34,197,94,0.15), color #22C55E
- Status badge failed: background rgba(239,68,68,0.15), color #EF4444
- Status badge pending: background rgba(234,179,8,0.15), color #EAB308

---

## Project Overview
Aplikasi web integrasi API dan Webhook dari developer.fingerspot.io.
Mengelola mesin absensi: user/karyawan, data absensi, PIN, kontrol mesin, dan logging.

---

## PENTING — Token dan Cloud ID
- Token (api_key) dan Cloud ID TIDAK disimpan di .env.local
- Disimpan di tabel settings di Supabase dengan key: api_key dan cloud_id
- Dikelola dari halaman Pengaturan (/pengaturan)
- lib/fingerspot.ts membaca api_key dan cloud_id dari tabel settings saat runtime
- Semua API call lewat /mesin/* route (server-side, token tidak exposed ke client)

---

## Environment Variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://zbisvbuetlylqouxmtfu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ISI_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=ISI_SERVICE_ROLE_KEY
WEBHOOK_SECRET=fingerspotwebhook2026

---

## Database Tables (Supabase)

Tabel settings: Konfigurasi cloud_id, api_key, webhook_secret
Tabel users: Data karyawan dari mesin
Tabel attendance_logs: Data absensi/scan dari mesin
Tabel device_pins: Daftar PIN dari mesin
Tabel api_logs: Riwayat semua request API yang dikirim
Tabel webhook_logs: Riwayat semua webhook yang masuk
Tabel command_logs: Riwayat command (set_time, restart, register_online)
Tabel qrcodes: Data QR code karyawan

### Kolom tabel users
cloud_id, pin, name, privilege, finger, face, password, rfid, vein, template, raw_payload, synced_at, created_at, updated_at

### Kolom tabel attendance_logs
cloud_id, pin, scan_time, verify, status_scan, photo_url, raw_payload, created_at

### Kolom tabel device_pins
cloud_id, pin, fetched_at

### Kolom tabel api_logs
cloud_id, trans_id, api_type, request_body, response_body, status_code, status, created_at, updated_at

### Kolom tabel webhook_logs
cloud_id, trans_id, webhook_type, raw_payload, status, created_at

### Kolom tabel command_logs
cloud_id, trans_id, command_type, request_body, response_body, status, notes, created_at

### Kolom tabel settings
key (unique), value, updated_at
Seed rows: cloud_id, api_key, webhook_secret

### Kolom tabel qrcodes
cloud_id, pin, qrcode, updated_at

---

## Fingerspot API
- Base URL: https://developer.fingerspot.io/api
- Method: POST untuk semua endpoint
- Header: Authorization: Bearer [api_key dari tabel settings]
- Body wajib: trans_id (generate otomatis pakai timestamp), cloud_id (dari tabel settings)

### Daftar API dan mapping tabel

get_attlog -> endpoint /get_attlog -> simpan ke attendance_logs -> via webhook Ya
get_userinfo -> endpoint /get_userinfo -> simpan ke users -> via webhook Ya
set_userinfo -> endpoint /set_userinfo -> simpan ke api_logs -> via webhook Konfirmasi
delete_userinfo -> endpoint /delete_userinfo -> simpan ke command_logs -> via webhook Konfirmasi
get_all_pin -> endpoint /get_all_pin -> simpan ke device_pins -> via webhook Ya
set_time -> endpoint /set_time -> simpan ke command_logs -> via webhook Konfirmasi
register_online -> endpoint /reg_online -> simpan ke command_logs -> via webhook Konfirmasi
restart_device -> endpoint /restart_device -> simpan ke command_logs -> via webhook Konfirmasi

---

## Webhook
- Endpoint di app: POST /api/webhook
- Fingerspot kirim data ke sini setelah mesin merespons
- Format body: type, cloud_id, trans_id, data
- Semua webhook SELALU insert ke webhook_logs (raw_payload)

### Tipe webhook dan aksi

attlog atau realtime_attlog -> Insert ke attendance_logs
get_attlog -> Insert ke attendance_logs (array)
get_userinfo -> Upsert ke users termasuk field template
set_userinfo -> Update status di api_logs
delete_userinfo -> Update status di api_logs + insert command_logs
get_all_pin -> Upsert ke device_pins
set_time -> Insert ke command_logs
register_online -> Insert ke command_logs
restart_device -> Insert ke command_logs

---

## Folder Structure

app/page.tsx -> Dashboard
app/user/page.tsx -> Data User
app/absensi/page.tsx -> Data Absensi
app/pin/page.tsx -> Data PIN
app/api-logs/page.tsx -> Riwayat API
app/api-logs/[id]/page.tsx -> Detail payload API log
app/webhook-logs/page.tsx -> Riwayat Webhook
app/webhook-logs/[id]/page.tsx -> Detail payload webhook
app/command-logs/page.tsx -> Riwayat Command
app/pengaturan/page.tsx -> Pengaturan
app/api/webhook/route.ts -> Terima webhook dari Fingerspot
app/mesin/get-attlog/route.ts
app/mesin/get-userinfo/route.ts
app/mesin/set-userinfo/route.ts
app/mesin/delete-userinfo/route.ts
app/mesin/get-all-pin/route.ts
app/mesin/set-time/route.ts
app/mesin/register-online/route.ts
app/mesin/restart/route.ts
app/components/Sidebar.tsx
app/components/Topbar.tsx
app/components/GlassCard.tsx
app/components/StatusBadge.tsx
app/components/TutorialPanel.tsx
app/components/LogTable.tsx
app/components/JsonViewer.tsx
app/components/UserFormModal.tsx
app/components/DeleteConfirmDialog.tsx
app/components/RegisterOnlineModal.tsx
app/components/UserDetailDrawer.tsx
lib/fingerspot.ts
lib/supabase/client.ts
lib/supabase/server.ts
lib/utils.ts
dokumentasi/vibe_code.md

---

## Sidebar Menu

Dashboard -> /
Data User -> /user
Absensi -> /absensi
Data PIN -> /pin
Riwayat API -> /api-logs
Riwayat Webhook -> /webhook-logs
Riwayat Command -> /command-logs
Pengaturan -> /pengaturan

Semua menu sejajar di sidebar, tidak ada submenu.

---

## Pages Detail

### / Dashboard
- 4 stat cards glass: Total User, Absensi Hari Ini, Total PIN, Status Mesin
- Quick action buttons: Sinkronisasi User, Ambil Absensi, Restart Mesin
- Recent attendance table 10 terbaru: PIN, Nama, Waktu Scan, Metode, Status
- Load data dari Supabase saat halaman dibuka

### /user Data User

Fitur:
1. Sinkronisasi -> trigger get_userinfo -> tampil data lengkap + template sidik jari
2. Tambah User -> form -> kirim set_userinfo (PIN baru)
3. Edit User -> form PIN disabled -> kirim set_userinfo (PIN existing)
4. Hapus User -> konfirmasi dialog -> kirim delete_userinfo
5. Register Online -> pilih tipe verifikasi -> kirim reg_online
6. Lihat Detail -> drawer -> tampilkan semua field + template bisa di-copy

Tabel kolom: PIN, Nama, Privilege badge, Finger count, Face ceklis atau strip, Template ceklis atau strip, Actions 3-dot
Menu 3-dot: Edit, Hapus, Lihat Detail, Register Online

Form Tambah User:
- PIN wajib (number input)
- Nama wajib (text input)
- Password (text input)
- Privilege dropdown: User Biasa (1), Admin/Manager (2), SubAdmin/Supervisor (3)
- RFID opsional
- Foto Wajah file upload max 100KB opsional, sistem auto double base64 encode, info khusus VIDA/DS/DT Series
- Template textarea opsional, info paste dari hasil Sinkronisasi Detail User Copy Template

Form Edit User: sama dengan Tambah tapi PIN disabled

Detail User drawer:
- Tampil semua field user
- Template field: read-only + tombol Copy Template
- Info: Gunakan nilai template ini saat tambah/edit user lain untuk sidik jari

Register Online modal:
- PIN display read-only
- Tipe verifikasi: Jari 0-9 input nomor jari, Wajah 12, Vein 13

Cara dapat template sidik jari:
1. Daftarkan sidik jari di mesin fisik
2. Sinkronisasi di halaman /user
3. Klik baris -> Detail -> Copy Template
4. Paste di form Tambah/Edit user lain

Note privilege: 1=User biasa, 2=Admin/Manager, 3=SubAdmin/Supervisor

### /absensi Data Absensi
- Filter: date range MAX 2 hari, PIN filter opsional
- Tombol Ambil Data Absensi -> trigger get_attlog
- Tabel: No, PIN, Nama, Waktu Scan, Metode Verifikasi badge, Status badge
- Metode: Jari (0-9), Password (1), Kartu (2), Wajah (15), GPS (5), Vein (6)
- Status: Masuk (0), Keluar (1), Break In (2), Break Out (3), OT In (4), OT Out (5)
- Export CSV button
- Realtime: update otomatis saat webhook attlog masuk
- Pagination

### /pin Data PIN
- Tombol Ambil Semua PIN -> trigger get_all_pin
- Tabel: No, PIN, Tanggal Fetch — HANYA kolom PIN, tidak ada nama
- TIDAK auto-trigger get_userinfo
- Info banner: Setelah ambil PIN, pergi ke Data User untuk sinkronisasi data lengkap
- Stats chips: Total PIN, Last Fetched
- TIDAK ada cross-reference nama di halaman ini

### /api-logs Riwayat Request API
- Tabel: Waktu, Tipe API badge, Trans ID, Status badge, Actions View Detail
- Filter: api_type, status, date range
- Detail page /api-logs/[id]: request_body + response_body JSON viewer
- Copy JSON button

### /webhook-logs Riwayat Webhook
- Tabel: Waktu, Tipe Webhook badge, Cloud ID, Trans ID, Status badge, Actions
- Filter: webhook_type, date range
- Detail page /webhook-logs/[id]: raw_payload JSON viewer
- Copy JSON button

### /command-logs Riwayat Command
- Tabel: Waktu, Command badge, Trans ID, Status badge, Catatan, Actions expand
- Filter: command_type, status, date range
- Expandable row: request_body + response_body JSON

### /pengaturan Pengaturan
- Form: Cloud ID input, API Token input masked dengan show/hide toggle
- Load nilai dari tabel settings saat halaman dibuka
- Save -> upsert ke tabel settings key cloud_id dan api_key
- Webhook URL display: [domain]/api/webhook + Copy button
- Info cara dapat token dari developer.fingerspot.io
- Set Time form: timezone dropdown -> POST /mesin/set-time
- Restart Mesin button -> warning dialog -> POST /mesin/restart
- Tutorial panel collapsible

---

## Key Implementation Rules
1. Token dan Cloud ID SELALU dari tabel settings, BUKAN hardcode atau .env
2. Semua API call lewat /mesin/* route (server-side)
3. Semua webhook masuk lewat /api/webhook
4. Max range get_attlog: 2 hari, validasi di frontend dan backend
5. get_all_pin TIDAK auto-trigger get_userinfo
6. Simpan raw_payload di semua tabel untuk debugging
7. Setiap halaman punya TutorialPanel collapsible glass card
8. Face encoding: double base64 — encode foto ke base64, lalu encode lagi ke base64
9. Template sidik jari: ambil dari field template di response get_userinfo via webhook
10. Privilege: 1=User, 2=Admin/Manager, 3=SubAdmin/Supervisor
11. Auto-generate trans_id pakai Date.now().toString()
12. Setelah set_userinfo berhasil, langsung upsert ke tabel users Supabase (tidak tunggu webhook)
13. Setelah delete_userinfo berhasil, langsung delete dari tabel users Supabase

---

## Dokumentasi Backend
Lihat file dokumentasi/vibe_code.md untuk detail implementasi backend lengkap.