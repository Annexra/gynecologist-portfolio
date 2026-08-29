# Dr. Raveena Thalluru - Medical Portfolio & Management System

An interactive, medical portfolio web application built for Dr. Raveena Thalluru (Gynecologist & Obstetrician). The platform integrates a public patient-facing interface with dynamic 3D medical visualizers and a protected CMS dashboard for content and appointment management via Supabase.

---

## ✨ Features

- **Public Website & Patient Experience**
  - **3D Interactive Medical Models**: High-performance WebGL visualizations (interactive 3D uterus and fetal growth anatomical models built with Three.js).
  - **Dynamic Services & Specializations**: Detailed listings for Obstetrics, Gynecological Surgeries, High-Risk Pregnancy Care, and Laparoscopy.
  - **Appointment Booking System**: Integrated appointment scheduling form with real-time database tracking.
  - **Doctor Profile & Qualifications**: Comprehensive showcase of clinical achievements, research, fellowship honors, and patient testimonials.

- **Admin CMS & Management Dashboard**
  - **Protected Authentication**: Role-based access control leveraging Supabase Auth (`/admin/login`).
  - **Appointment Management**: Real-time tracking, status updates (Pending, Confirmed, Cancelled), and search/filter interface.
  - **Patient Review Management**: Publish and moderate patient testimonials.
  - **Dynamic Content & Announcements**: Post announcements, practice updates, and educational materials directly to the public website.

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 19, Vite 8
- **3D Graphics & Rendering**: Three.js (`three`)
- **Icons**: Lucide React (`lucide-react`)
- **Backend & Database**: Supabase JS Client (`@supabase/supabase-js`)
- **Styling**: Modern CSS with Material Design / Custom tokens
- **Build Tooling**: Vite with ES Modules support

---

## 📁 Repository Structure

```text
repo/
├── src/
│   ├── components/         # React Components (Public website sections, Admin CMS, 3D visualizers)
│   ├── context/            # Global Auth Context & State Management
│   ├── lib/                # Database configuration & Supabase client initialization
│   ├── services/           # API handlers & Supabase CRUD abstractions
│   └── styles/             # Global CSS stylesheets & design tokens
├── public/                 # Static assets & 3D GLTF/GLB models
├── supabase/               # Database migrations & SQL setup scripts
├── index.html              # HTML entrypoint
├── vite.config.js          # Vite bundler configuration
└── package.json            # Dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- A **Supabase** project instance (for Database, Auth & Storage)

### Database & Storage Setup

Run the SQL migration scripts in your Supabase SQL Editor in the following order:

1. **Schema & Seed Migration**: `supabase/migrations/20260829000000_init_schema.sql` (Creates database tables, admin roles, seed data, and table RLS policies).
2. **Storage Bucket Migration**: `supabase/migrations/20260830000000_storage_setup.sql` (Creates the `portfolio-media` storage bucket and file upload RLS policies).

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/kameshwar692007-cmd/gynecologist-portfolio.git
   cd gynecologist-portfolio/repo
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `repo/` directory (or use `.env.example` as a template):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Preview Production Build**:
   ```bash
   npm run preview
   ```

---

## 🔑 Admin Access

- Access the Admin Login portal at `/admin/login` or `/admin`.
- Log in with valid Supabase user credentials assigned to the `admin` role.

---

## 🛡️ License

This project is proprietary and maintained for Dr. Raveena Thalluru's medical practice.
