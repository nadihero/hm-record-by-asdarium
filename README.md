# HM Record

Aplikasi pencatatan jam kerja operator (Hour Meter Record) untuk industri pertambangan. Dibangun dengan Next.js 16, TailwindCSS, dan Prisma.

## Fitur

### 📊 Dashboard
- Statistik jam kerja periode aktif
- Record terbaru dengan navigasi cepat
- Tampilan iOS-style yang modern

### 📷 Upload Timesheet
- Upload foto timesheet (kompres otomatis, maks. 5 MB)
- Retry upload saat jaringan lambat
- Input manual tanpa foto

### 📈 Laporan
- Rekap periode kerja (19 → 18)
- Galeri foto timesheet + edit/hapus (tekan lama)
- Filter berdasarkan periode

### ✅ Absensi
- Kalender periode kerja
- Shift siang/malam dengan jam otomatis

### 👥 Admin Panel
- Manajemen karyawan
- Lihat semua record
- Reset data

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: TailwindCSS 4
- **Database**: MariaDB + Prisma ORM
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites
- Node.js 18+
- MariaDB/MySQL

### Installation

1. Clone repository
```bash
git clone https://github.com/nadihero/hm-record-by-asdarium.git
cd hm-record-by-asdarium
```

2. Install dependencies
```bash
npm install
```

3. Setup environment
```bash
cp .env.example .env
# Edit .env dengan konfigurasi database Anda
```

4. Setup database
```bash
npx prisma migrate deploy
```

5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── admin/          # Admin pages
│   ├── api/            # API routes
│   ├── login/          # Authentication
│   ├── report/         # Reports
│   ├── timesheet/      # Dashboard employee
│   └── upload/         # Upload timesheet
├── components/         # Reusable components
├── lib/                # Utilities & helpers
├── prisma/             # Database schema
└── uploads/            # Uploaded images
```

## Environment Variables

```env
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=hm_record
```

## License

MIT
