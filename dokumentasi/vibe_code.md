# vibe_code.md - Backend Implementation
Stack: Next.js 14+ App Router + TypeScript + Supabase
Referensi API: https://developer.fingerspot.io/customer/api
Prerequisite: UI halaman sudah selesai

---

## Penyesuaian Nama Tabel Supabase

attlogs -> attendance_logs
userinfos -> users
pins -> device_pins
api_requests -> api_logs
webhook_logs -> webhook_logs (sama)
command_logs -> command_logs (sama)
settings -> settings
qrcodes -> qrcodes

---

## Environment Variables (.env.local)

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WEBHOOK_SECRET=fingerspotwebhook2026

CATATAN: api_key dan cloud_id TIDAK di .env
Disimpan di tabel settings Supabase, dibaca runtime oleh lib/fingerspot.ts

---

## STEP 1 - Database Schema (Supabase SQL Editor)

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id         bigserial PRIMARY KEY,
  key        text NOT NULL UNIQUE,
  value      text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
INSERT INTO settings (key, value) VALUES
  ('cloud_id', ''),
  ('api_key', ''),
  ('webhook_secret', '')
ON CONFLICT (key) DO NOTHING;

-- Users/Karyawan
CREATE TABLE IF NOT EXISTS users (
  id          bigserial PRIMARY KEY,
  cloud_id    text NOT NULL,
  pin         text NOT NULL,
  name        text DEFAULT '',
  privilege   int4 DEFAULT 0,
  finger      int4 DEFAULT 0,
  face        int4 DEFAULT 0,
  password    text DEFAULT '',
  rfid        int4 DEFAULT 0,
  vein        int4 DEFAULT 0,
  template    text DEFAULT '',
  raw_payload jsonb,
  synced_at   timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE users ADD CONSTRAINT users_cloud_pin_unique UNIQUE (cloud_id, pin);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Attendance Logs
CREATE TABLE IF NOT EXISTS attendance_logs (
  id          bigserial PRIMARY KEY,
  cloud_id    text NOT NULL,
  pin         text NOT NULL,
  scan_time   text NOT NULL,
  verify      int4 DEFAULT 0,
  status_scan int4 DEFAULT 0,
  photo_url   text,
  raw_payload jsonb,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attlog_scan ON attendance_logs (scan_time DESC);
CREATE INDEX IF NOT EXISTS idx_attlog_pin ON attendance_logs (pin);
ALTER TABLE attendance_logs DISABLE ROW LEVEL SECURITY;

-- Device PINs
CREATE TABLE IF NOT EXISTS device_pins (
  id         bigserial PRIMARY KEY,
  cloud_id   text NOT NULL,
  pin        text NOT NULL,
  fetched_at timestamptz DEFAULT now()
);
ALTER TABLE device_pins ADD CONSTRAINT device_pins_unique UNIQUE (cloud_id, pin);
ALTER TABLE device_pins DISABLE ROW LEVEL SECURITY;

-- API Logs
CREATE TABLE IF NOT EXISTS api_logs (
  id            bigserial PRIMARY KEY,
  cloud_id      text,
  trans_id      text,
  api_type      text NOT NULL,
  request_body  jsonb,
  response_body jsonb,
  status_code   int4,
  status        text DEFAULT 'pending',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs (created_at DESC);
ALTER TABLE api_logs DISABLE ROW LEVEL SECURITY;

-- Webhook Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id           bigserial PRIMARY KEY,
  cloud_id     text,
  trans_id     text,
  webhook_type text NOT NULL,
  raw_payload  jsonb NOT NULL,
  status       text DEFAULT 'received',
  created_at   timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_created ON webhook_logs (created_at DESC);
ALTER TABLE webhook_logs DISABLE ROW LEVEL SECURITY;

-- Command Logs
CREATE TABLE IF NOT EXISTS command_logs (
  id            bigserial PRIMARY KEY,
  cloud_id      text,
  trans_id      text,
  command_type  text NOT NULL,
  request_body  jsonb,
  response_body jsonb,
  status        text DEFAULT 'pending',
  notes         text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE command_logs DISABLE ROW LEVEL SECURITY;

-- QR Codes
CREATE TABLE IF NOT EXISTS qrcodes (
  id         bigserial PRIMARY KEY,
  cloud_id   text NOT NULL,
  pin        text NOT NULL,
  qrcode     text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE qrcodes ADD CONSTRAINT qrcodes_unique UNIQUE (cloud_id, pin);
ALTER TABLE qrcodes DISABLE ROW LEVEL SECURITY;

---

## STEP 2 - Struktur Folder

app/
  page.tsx                       -> Dashboard
  user/page.tsx                  -> Data User
  absensi/page.tsx               -> Data Absensi
  pin/page.tsx                   -> Data PIN
  api-logs/page.tsx              -> Riwayat API
  api-logs/[id]/page.tsx         -> Detail payload API log
  webhook-logs/page.tsx          -> Riwayat Webhook
  webhook-logs/[id]/page.tsx     -> Detail payload webhook
  command-logs/page.tsx          -> Riwayat Command
  pengaturan/page.tsx            -> Pengaturan
  api/webhook/route.ts           -> Terima webhook dari Fingerspot
  mesin/
    get-attlog/route.ts
    get-userinfo/route.ts
    set-userinfo/route.ts
    delete-userinfo/route.ts
    get-all-pin/route.ts
    set-time/route.ts
    register-online/route.ts
    restart/route.ts
  components/
    Sidebar.tsx
    Topbar.tsx
    GlassCard.tsx
    StatusBadge.tsx
    TutorialPanel.tsx
    LogTable.tsx
    JsonViewer.tsx
    UserFormModal.tsx
    DeleteConfirmDialog.tsx
    RegisterOnlineModal.tsx
    UserDetailDrawer.tsx

lib/
  fingerspot.ts
  supabase/client.ts
  supabase/server.ts
  utils.ts

dokumentasi/
  vibe_code.md

---

## STEP 3 - Helper Files

### lib/supabase/client.ts
Supabase browser client menggunakan createBrowserClient dari @supabase/ssr.
Gunakan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.

### lib/supabase/server.ts
Supabase server client menggunakan createServerClient dari @supabase/ssr.
Integrasikan dengan cookies() dari next/headers.

### lib/fingerspot.ts
Fungsi callFingerspot(endpoint, body):
- Baca api_key dan cloud_id dari tabel settings Supabase
- POST ke https://developer.fingerspot.io/api/{endpoint}
- Header: Authorization: Bearer {api_key}
- Auto-generate trans_id: Date.now().toString()
- Auto-inject cloud_id ke body
- Insert log ke api_logs dengan status pending sebelum request
- Update log status success atau failed setelah response
- Return: { success, data, message, transId }

### lib/utils.ts
formatDate(date) -> format tanggal lokal Indonesia
cn(...classes) -> merge Tailwind class pakai clsx
formatVerifyType(code) -> konversi kode verify:
  0-9: Jari, 1: Password, 2: Kartu, 15: Wajah, 5: GPS, 6: Vein
formatStatusScan(code) -> konversi kode status:
  0: Masuk, 1: Keluar, 2: Break In, 3: Break Out, 4: OT In, 5: OT Out
encodeDoubleBase64(bytes) -> double base64 encode untuk foto wajah:
  Step 1: bytes foto -> base64 string (hasil pertama)
  Step 2: string hasil pertama -> UTF8 bytes -> base64 lagi (hasil final)

---

## STEP 4 - Webhook Handler

### app/api/webhook/route.ts
Terima POST dari Fingerspot.
Selalu insert ke webhook_logs (raw_payload) untuk semua tipe.

Pola handle per type:

attlog atau realtime_attlog:
  Insert ke attendance_logs:
  cloud_id, pin, scan_time=data.scan, verify=data.verify,
  status_scan=data.status_scan, photo_url=data.photo_url, raw_payload=body

get_attlog:
  data berupa array
  Insert semua record ke attendance_logs

get_userinfo:
  Upsert ke users:
  cloud_id, pin, name, privilege, finger, face,
  password, rfid, vein, template=data.template, raw_payload=body
  PENTING: simpan field template untuk data sidik jari

set_userinfo:
  Update api_logs set status=success atau failed
  WHERE trans_id = trans_id AND api_type = set_userinfo

delete_userinfo:
  Update api_logs set status=success atau failed
  Insert ke command_logs

get_all_pin:
  data berupa array PIN
  Upsert ke device_pins per PIN

set_time:
  Insert ke command_logs: command_type=set_time, status, response_body=body

register_online:
  Insert ke command_logs: command_type=register_online, status, response_body=body

restart_device:
  Insert ke command_logs: command_type=restart_device, status, response_body=body

---

## STEP 5 - API Routes (app/mesin/)

Pola umum setiap route:
1. Terima body dari frontend
2. Insert log ke api_logs status pending
3. Panggil callFingerspot(endpoint, body)
4. Update log status success atau failed
5. Return response ke frontend

---

### 5.1 Get Attlog
File: app/mesin/get-attlog/route.ts
Trigger: Halaman /absensi -> tombol Ambil Data Absensi
Note: Max range 2 hari. Validasi di backend, reject kalau lebih dari 2 hari.

URL    : https://developer.fingerspot.io/api/get_attlog
Method : POST
Body   : { trans_id, cloud_id, start_date, end_date }

---

### 5.2 Get Userinfo
File: app/mesin/get-userinfo/route.ts
Trigger: Halaman /user -> tombol Sinkronisasi Data User
Note: Response via webhook -> upsert users TERMASUK field template.
TIDAK dipanggil otomatis dari get_all_pin.

URL    : https://developer.fingerspot.io/api/get_userinfo
Method : POST
Body   : { trans_id, cloud_id }

---

### 5.3 Set Userinfo
File: app/mesin/set-userinfo/route.ts
Trigger:
  Halaman /user -> tombol Tambah User -> form save (PIN baru)
  Halaman /user -> 3-dot -> Edit -> form save (PIN existing)

Note:
  Jika PIN belum ada di mesin -> tambah user baru
  Jika PIN sudah ada -> update data user
  face: double base64 encoded photo, khusus VIDA/DS/DT Series
  template: string sidik jari dari hasil get_userinfo
  privilege: 1=User, 2=Admin, 3=SubAdmin
  Setelah API berhasil, langsung upsert ke tabel users Supabase
  (tidak tunggu webhook karena webhook set_userinfo tidak bawa data lengkap)

URL    : https://developer.fingerspot.io/api/set_userinfo
Method : POST
Body   : {
  trans_id, cloud_id,
  data: { pin, name, privilege, password, rfid, template, face }
}

---

### 5.4 Delete Userinfo
File: app/mesin/delete-userinfo/route.ts
Trigger: Halaman /user -> 3-dot -> Hapus -> konfirmasi dialog
Note: Setelah API berhasil, langsung DELETE dari tabel users Supabase.

URL    : https://developer.fingerspot.io/api/delete_userinfo
Method : POST
Body   : { trans_id, cloud_id, pin }

---

### 5.5 Get All PIN
File: app/mesin/get-all-pin/route.ts
Trigger: Halaman /pin -> tombol Ambil Semua PIN
Note:
  TIDAK auto-trigger get_userinfo setelahnya
  Tampil di /pin: hanya PIN saja, tanpa nama
  Data user lengkap diambil terpisah via get_userinfo di halaman /user

URL    : https://developer.fingerspot.io/api/get_all_pin
Method : POST
Body   : { trans_id, cloud_id }

---

### 5.6 Set Time
File: app/mesin/set-time/route.ts
Trigger: Halaman /pengaturan -> form set waktu -> tombol Set Waktu
Note: Kirim value timezone dari dropdown option. Log ke command_logs.

URL    : https://developer.fingerspot.io/api/set_time
Method : POST
Body   : { trans_id, cloud_id, timezone }

---

### 5.7 Register Online
File: app/mesin/register-online/route.ts
Trigger: Halaman /user -> 3-dot -> Register Online -> pilih tipe -> submit
Note:
  verification: 0-9=Jari (nomor jari), 12=Wajah, 13=Vein
  Log ke command_logs

URL    : https://developer.fingerspot.io/api/reg_online
Method : POST
Body   : { trans_id, cloud_id, pin, verification }

---

### 5.8 Restart Mesin
File: app/mesin/restart/route.ts
Trigger: Halaman /pengaturan -> tombol Restart Mesin
Note: Tampilkan warning dialog sebelum kirim. Log ke command_logs.

URL    : https://developer.fingerspot.io/api/restart_device
Method : POST
Body   : { trans_id, cloud_id }

---

## STEP 6 - Halaman dan Koneksi ke API Routes

### Dashboard (/)
Load dari Supabase:
  COUNT users
  COUNT attendance_logs WHERE DATE(scan_time) = today
  COUNT device_pins
  SELECT value FROM settings WHERE key = cloud_id
Recent 10 attendance_logs JOIN users ON pin

### /user Data User
Load: SELECT * FROM users ORDER BY pin
Sinkronisasi: POST /mesin/get-userinfo -> tunggu webhook 10 detik -> reload
Tambah User: POST /mesin/set-userinfo (data baru) + upsert users Supabase
Edit User: POST /mesin/set-userinfo (data existing) + update users Supabase
Hapus User: POST /mesin/delete-userinfo + DELETE FROM users
Register Online: POST /mesin/register-online
Detail User: tampil semua field + template (Copy button)
Face upload: auto double base64 encode di client sebelum kirim

### /absensi Data Absensi
Load: SELECT * FROM attendance_logs WHERE cloud_id=? AND scan_time BETWEEN ? AND ?
Validasi date range max 2 hari di frontend dan backend
Fetch: POST /mesin/get-attlog -> tunggu webhook -> reload table
JOIN dengan users untuk tampilkan nama

### /pin Data PIN
Load: SELECT pin, fetched_at FROM device_pins WHERE cloud_id=?
Ambil PIN: POST /mesin/get-all-pin -> tunggu webhook -> reload
Tampil HANYA kolom: No, PIN, Tanggal Fetch

### /api-logs
Load: SELECT * FROM api_logs ORDER BY created_at DESC
Filter by api_type, status, date
Detail /api-logs/[id]: tampil request_body + response_body JSON

### /webhook-logs
Load: SELECT * FROM webhook_logs ORDER BY created_at DESC
Filter by webhook_type, date
Detail /webhook-logs/[id]: tampil raw_payload JSON

### /command-logs
Load: SELECT * FROM command_logs ORDER BY created_at DESC
Filter by command_type, status, date
Expandable row: request_body + response_body

### /pengaturan
Load: SELECT * FROM settings
Save: UPSERT settings SET value WHERE key IN (cloud_id, api_key)
Tampil webhook URL: window.location.origin + /api/webhook
Copy webhook URL button
Set Time form: timezone dropdown -> POST /mesin/set-time
Restart Mesin button -> warning dialog -> POST /mesin/restart

---

## Checklist Backend

Database:
[ ] Tabel settings dengan seed 3 row
[ ] Tabel users dengan kolom template
[ ] Tabel attendance_logs
[ ] Tabel device_pins
[ ] Tabel api_logs
[ ] Tabel webhook_logs
[ ] Tabel command_logs
[ ] Tabel qrcodes
[ ] Semua RLS disabled

Helper Files:
[ ] lib/supabase/client.ts
[ ] lib/supabase/server.ts
[ ] lib/fingerspot.ts (baca dari tabel settings)
[ ] lib/utils.ts (formatDate, cn, formatVerifyType, formatStatusScan, encodeDoubleBase64)

Webhook Handler:
[ ] app/api/webhook/route.ts (handle semua tipe)

API Routes:
[ ] get-attlog (validasi max 2 hari)
[ ] get-userinfo
[ ] set-userinfo (tambah + edit + face encode + template)
[ ] delete-userinfo
[ ] get-all-pin (TIDAK auto-trigger get-userinfo)
[ ] set-time
[ ] register-online
[ ] restart

Pages:
[ ] Dashboard stat cards + recent attendance
[ ] /user sinkronisasi, tambah, edit, hapus, register online, detail+copy template
[ ] /absensi filter max 2 hari, fetch, realtime
[ ] /pin ambil PIN, tampil PIN saja
[ ] /api-logs + /api-logs/[id]
[ ] /webhook-logs + /webhook-logs/[id]
[ ] /command-logs
[ ] /pengaturan load+save settings, webhook URL, set time, restart

---

## Referensi
Fingerspot API: https://developer.fingerspot.io/customer/api
Supabase Docs: https://supabase.com/docs
Next.js App Router: https://nextjs.org/docs/app
