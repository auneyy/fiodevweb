# RAQ - Run API Quick

Dashboard manajemen perangkat Fingerspot berbasis Next.js + Supabase. Mengelola absensi, user/karyawan, dan memantau semua komunikasi API dengan device Fingerspot melalui Fingerspot Cloud.

## Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 16.x (App Router) | Framework |
| React | 19.x | UI Library |
| TypeScript | ^5 | Bahasa |
| Tailwind CSS | v4 | Styling |
| Supabase | ^2.x | Database + Auth |
| lucide-react | ^1.x | Icons |

---

## 1. Clone Project

```bash
git clone https://github.com/auneyy/task2new_fiodev.git
cd task2new_fiodev
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Setup Supabase

### 3.1 Buat Project Supabase

1. Buka [https://supabase.com](https://supabase.com) dan login atau register jika belum punya akun
2. Klik **New Project** → isi nama project, database password, dan region
3. Tunggu hingga project selesai dibuat

### 3.2 Ambil Credentials

Buka **Settings → API** di dashboard Supabase, catat:

- **Project URL** → untuk `NEXT_PUBLIC_SUPABASE_URL`
- **anon/public key** → untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → untuk `SUPABASE_SERVICE_ROLE_KEY` (ini rahasia ya)

### 3.3 Buat Database Schema

Buka **SQL Editor** di dashboard Supabase, jalankan SQL ini satu persatu:

#### Tabel Settings (Global Config)

```sql
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
```

#### Tabel Users (Karyawan)

```sql
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
```

#### Tabel Attendance Logs

```sql
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
```

#### Tabel Device PINs

```sql
CREATE TABLE IF NOT EXISTS device_pins (
  id         bigserial PRIMARY KEY,
  cloud_id   text NOT NULL,
  pin        text NOT NULL,
  fetched_at timestamptz DEFAULT now()
);
ALTER TABLE device_pins ADD CONSTRAINT device_pins_unique UNIQUE (cloud_id, pin);
ALTER TABLE device_pins DISABLE ROW LEVEL SECURITY;
```

#### Tabel API Logs

```sql
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
```

#### Tabel Webhook Logs

```sql
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
```

#### Tabel Command Logs

```sql
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
```

#### Tabel QR Codes

```sql
CREATE TABLE IF NOT EXISTS qrcodes (
  id         bigserial PRIMARY KEY,
  cloud_id   text NOT NULL,
  pin        text NOT NULL,
  qrcode     text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE qrcodes ADD CONSTRAINT qrcodes_unique UNIQUE (cloud_id, pin);
ALTER TABLE qrcodes DISABLE ROW LEVEL SECURITY;
```

#### Multi-Tenant Migration (RLS + user_settings)

Kalau sudah, jalankan file `supabase/migration_multi_tenant.sql` untuk menambahkan:

- Kolom `user_id` ke semua tabel
- Tabel `user_settings` (menyimpan `cloud_id` dan `api_key` per user)
- Fungsi `get_user_cloud_id()` untuk RLS
- Enable RLS + policies di semua tabel

```sql
-- Ringkasan yang dibuat migration:
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id)
-- CREATE TABLE user_settings (user_id, cloud_id, api_key)
-- CREATE FUNCTION get_user_cloud_id() RETURNS text
-- ENABLE ROW LEVEL SECURITY + policies
```

### 3.4 Ringkasan Database Tables

| Tabel | Fungsi |
|---|---|
| `settings` | Konfigurasi global (cloud_id, api_key, webhook_secret) |
| `users` | Data karyawan/user dari device Fingerspot |
| `attendance_logs` | Log absensi (scan in/out) |
| `device_pins` | Semua PIN yang terdaftar di device |
| `api_logs` | Audit trail request/response API |
| `webhook_logs` | Riwayat webhook dari Fingerspot |
| `command_logs` | Riwayat perintah ke device |
| `qrcodes` | Penyimpanan QR code per user |
| `user_settings` | Kredensial Fingerspot per user (cloud_id, api_key) |

---

## 4. Konfigurasi Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WEBHOOK_SECRET=fingerspotwebhook2026
```

| Variable | Keterangan | Lokasi di Supabase |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (rahasiakan!) | Settings → API → service_role |
| `WEBHOOK_SECRET` | Secret untuk validasi webhook | Bebas (sesuaikan) |

> **Catatan:** `cloud_id` dan `api_key` Fingerspot disimpan di tabel `user_settings` per user, bukan di `.env`.

---

## 5. Menjalankan Project

```bash
# Development server
npm run dev

# Buka di browser
# http://localhost:3000
```

### Command Lainnya

```bash
npm run build    # Build production
npm run start    # Jalankan production server
npm run lint     # Jalankan ESLint
```

---

## 6. Alur Aplikasi

### 6.1 Alur Autentikasi

```
/register → Email verification → /login → /dashboard
                                           ↓
                                    /2fa/setup (optional, sekali saja)
                                           ↓
                                    /2fa/verify (setiap login)
```

1. User register dengan email + password
2. Supabase mengirim email verifikasi
3. Setelah verifikasi, user login
4. Setup 2FA (TOTP) → scan QR code dengan authenticator app
5. Setiap login harus verifikasi TOTP

### 6.2 Alur Sinkronisasi Device

```
/pengaturan → Set cloud_id + api_key
      ↓
/user → Sinkron Data (get_userinfo)
      ↓
   POST /mesin/get-userinfo → Fingerspot Cloud → Webhook → DB
      ↓
/absensi → Ambil Data Absensi (get_attlog)
      ↓
   POST /mesin/get-attlog → Fingerspot Cloud → Webhook → DB
```

### 6.3 Alur Webhook

```
Fingerspot Cloud → POST /api/webhook → Simpan ke webhook_logs
                                      → Route ke tabel terkait:
                                         - attlog → attendance_logs
                                         - get_userinfo → users (upsert)
                                         - get_all_pin → device_pins
                                         - set_userinfo/delete_userinfo → api_logs update
                                         - set_time/restart → command_logs
```

### 6.4 Alur Command ke Device

```
Frontend → POST /mesin/{endpoint} → Insert api_logs (pending)
                                   → callFingerspot() → Fingerspot Cloud API
                                   → Update api_logs (success/failed)
                                   → Tunggu webhook response (~10-12 detik)
                                   → Return ke frontend
```

---

## 7. Struktur Project

```
app/
├── page.tsx                        # Landing page (/)
├── layout.tsx                      # Root layout
├── globals.css                     # Global styles
│
├── (auth)/
│   ├── login/page.tsx              # /login
│   └── register/page.tsx           # /register
│
├── auth/callback/route.ts          # Email verification callback
│
├── 2fa/
│   ├── setup/page.tsx              # /2fa/setup (TOTP enrollment)
│   └── verify/page.tsx             # /2fa/verify
│
├── dashboard/page.tsx              # /dashboard (stats + chart)
├── user/page.tsx                   # /user (CRUD karyawan)
├── absensi/page.tsx                # /absensi (log absensi)
├── pin/page.tsx                    # /pin (device PINs)
├── api-logs/page.tsx               # /api-logs (riwayat API)
├── api-logs/[id]/page.tsx          # /api-logs/:id
├── webhook-logs/page.tsx           # /webhook-logs
├── webhook-logs/[id]/page.tsx      # /webhook-logs/:id
├── command-logs/page.tsx           # /command-logs
├── pengaturan/page.tsx             # /pengaturan (settings)
│
├── api/webhook/route.ts            # POST /api/webhook
├── mesin/                          # API routes ke Fingerspot
│   ├── get-attlog/route.ts
│   ├── get-userinfo/route.ts
│   ├── set-userinfo/route.ts
│   ├── delete-userinfo/route.ts
│   ├── get-all-pin/route.ts
│   ├── set-time/route.ts
│   ├── register-online/route.ts
│   ├── restart/route.ts
│   └── cleanup-ghost/route.ts
│
└── components/                     # Shared UI components
    ├── AppShell.tsx
    ├── Sidebar.tsx
    ├── Topbar.tsx
    ├── GlassCard.tsx
    ├── StatusBadge.tsx
    ├── Pagination.tsx
    ├── Toast.tsx
    ├── JsonViewer.tsx
    └── TutorialPanel.tsx

lib/
├── supabase/
│   ├── server.ts                   # Supabase SSR server client
│   └── client.ts                   # Supabase browser client
├── fingerspot.ts                   # callFingerspot() - API proxy
├── request-user.ts                 # Extract user from cookies
├── user-settings.ts                # Server-side getUserCloudId()
├── user-settings-client.ts         # Client-side getClientCloudId()
└── utils.ts                        # cn(), formatDate(), dll

supabase/
└── migration_multi_tenant.sql      # Multi-tenant RLS migration
```

---

## 8. Halaman & Fitur

| Route | Fitur |
|---|---|
| `/` | Landing page dengan showcase API commands |
| `/login` | Login dengan email + password |
| `/register` | Registrasi + email verifikasi |
| `/dashboard` | Stats cards, chart 7 hari, recent attendance |
| `/user` | CRUD karyawan, sinkron dari device, register online |
| `/absensi` | Log absensi, filter tanggal, export CSV |
| `/pin` | Daftar PIN dari device |
| `/api-logs` | Riwayat request API, filter type/status |
| `/webhook-logs` | Riwayat webhook masuk |
| `/command-logs` | Riwayat perintah ke device |
| `/pengaturan` | Setting cloud_id/api_key, timezone, restart, webhook URL, 2FA |

---

## 9. API Endpoints

### Webhook Receiver

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/webhook` | POST | Menerima webhook dari Fingerspot Cloud |

### Device Commands (Proxy ke Fingerspot API)

| Endpoint | Method | Fungsi |
|---|---|---|
| `/mesin/get-attlog` | POST | Ambil log absensi (max 2 hari) |
| `/mesin/get-userinfo` | POST | Sync semua data user dari device |
| `/mesin/set-userinfo` | POST | Tambah/update user ke device |
| `/mesin/delete-userinfo` | POST | Hapus user dari device |
| `/mesin/get-all-pin` | POST | Ambil semua PIN dari device |
| `/mesin/set-time` | POST | Sinkron timezone device |
| `/mesin/register-online` | POST | Register verifikasi biometrik |
| `/mesin/restart` | POST | Restart device dari jarak jauh |
| `/mesin/cleanup-ghost` | POST | Hapus ghost records (user null ini untuk menghapus data user jika tiba-tiba saat sinkronisasi ada data yang kosong) |

---

## 10. Trouble Shooting

### 10.1 `npm install` gagal

```bash
# Hapus node_modules dan lock file, lalu install ulang
rm -rf node_modules package-lock.json
npm install
```

### 10.2 Supabase connection error

- Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan key benar di `.env.local`
- Cek apakah project Supabase masih aktif (tidak paused)
- Pastikan IP server kamu tidak di-block di Supabase Network Settings

### 10.3 Webhook tidak masuk

- Pastikan URL webhook perangkat absensi di developer.fingerspot.io adalah: `https://domain-anda.com/api/webhook` atau bisa menggunakan url yang sudah tertera pada halaman pengaturan
- Jika local development, gunakan **ngrok** atau **localtunnel** untuk expose localhost:
  ```bash
  ngrok http 3000
  ```
- Pastikan `WEBHOOK_SECRET` cocok dengan yang dikirim Fingerspot
- Cek tab **Webhook Logs** di dashboard untuk melihat payload masuk

### 10.4 API Command timeout / tidak ada response

- Fingerspot Cloud membutuhkan waktu ~10-12 detik untuk merespons via webhook
- Pastikan device online dan terhubung ke internet
- Cek **API Logs** di dashboard untuk melihat status request (pending/success/failed)
- Jika device belum register online, jalankan `/pengaturan` → Register Online dulu

### 10.5 Error 401 / Unauthorized di API Fingerspot

- Pastikan `cloud_id` dan `api_key` sudah diisi dengan benar di `/pengaturan`
- Cek apakah API key masih valid di Fingerspot Developer Portal
- Pastikan tidak ada spasi atau karakter tersembunyi di nilai `cloud_id`/`api_key`

### 10.6 2FA locked out

- Jika kehilangan akses authenticator app, reset dari database:
  ```sql
  DELETE FROM auth.mfa_factors WHERE user_id = 'YOUR_USER_ID';
  ```
- Atau login ke Supabase Dashboard → Authentication → Users → hapus factor TOTP

### 10.7 `user_settings` table not found

- Pastikan migration multi-tenant sudah dijalankan di SQL Editor:
  - Buka file `supabase/migration_multi_tenant.sql`
  - Copy isi file → paste ke SQL Editor → Run

### 10.8 Data tidak muncul di dashboard

- Pastikan `cloud_id` di `/pengaturan` sudah terisi
- Cek RLS policies di Supabase → Table Editor → pilih tabel → Policies
- Untuk debugging, bisa disable RLS sementara (tidak disarankan untuk production):
  ```sql
  ALTER TABLE nama_tabel DISABLE ROW LEVEL SECURITY;
  ```

### 10.9 Build error

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

---

## Referensi

- [Fingerspot API Documentation](https://developer.fingerspot.io/customer/api)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
