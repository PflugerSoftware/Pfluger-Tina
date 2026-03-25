# TINA - 360 Image Viewer

A web application for viewing and managing 360-degree panoramic images. Two modes: an admin interface for managing projects/images (designed for touchscreen + projector), and a client view for browsing 360 panoramas on a desktop.

## Features

### Admin Mode (Pfluger)
- **Project Organization**: Create and manage projects
- **Drag & Drop Upload**: Upload equirectangular 360 images
- **Interactive Viewer**: Opens in a separate popup window for projector display
- **TouchPad Controls**: Pan and zoom the 360 view from a touchscreen
- **Drag to Reorder**: Reorder images within a project
- **Dark/Light Theme**: Toggle between themes

### Client Mode (Project Login)
- **Read-Only Gallery**: View a single project's images
- **Inline 360 Viewer**: Pannellum panorama with mouse controls directly in the page
- **Thumbnail Navigation**: Browse images via thumbnail strip below the viewer
- **Analytics**: Tracks which images are viewed and for how long
- **Clean URLs**: `/:project-name` for gallery, `/:project-name/360` for viewer

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **360 Viewer**: Pannellum (loaded dynamically)
- **Backend**: Supabase (PostgreSQL + Storage)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/PflugerSoftware/Pfluger-Tina.git
cd Pfluger-Tina
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run both migrations:
   - `supabase/migrations/001_initial_schema.sql` - tables, indexes, RLS, storage
   - `supabase/migrations/002_analytics.sql` - analytics tracking table
3. Go to **Settings > API** and copy your Project URL and Anon/Public key

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Authentication

Login is password-gated with hardcoded credentials in `src/config/passwords.ts`.

| Login | Password | Mode |
|-------|----------|------|
| Pfluger (Admin) | `Pfluger1010!` | Full access - all projects, upload, delete, reorder |
| Flour Bluff | `Hornets2026!` | Read-only - Flour Bluff project images only |

To add a new project login, add the project's UUID and password to the `PASSWORDS` object in `src/config/passwords.ts`. Only projects with a password entry appear in the client dropdown.

## Project Structure

```
src/
├── components/
│   ├── ClientApp.tsx          # Client mode shell (gallery/viewer toggle)
│   ├── CreateProjectModal.jsx # New project dialog
│   ├── DesktopView.tsx        # Inline 360 viewer with mouse controls
│   ├── ImageGallery.tsx       # Read-only image grid (client mode)
│   ├── LoginPage.tsx          # Login screen with dropdown + password
│   ├── ProtectedRoute.tsx     # Route guard
│   ├── SortableImageGrid.jsx  # Draggable image grid (admin mode)
│   ├── ThemeToggle.tsx        # Light/dark mode toggle
│   ├── TouchPad.jsx           # Pan/zoom controls (admin mode)
│   └── ViewerPage.jsx         # Pannellum 360 viewer popup (admin mode)
├── config/
│   └── passwords.ts           # Hardcoded login credentials
├── contexts/
│   ├── AuthContext.tsx         # Auth state (mode, project, session)
│   └── ThemeContext.tsx        # Theme state management
├── lib/
│   └── supabase.ts            # Supabase client
├── utils/
│   ├── analytics.ts           # View tracking (client mode)
│   ├── api.js                 # API functions for projects/images
│   └── pannellum.ts           # Shared Pannellum loader
├── App.tsx                    # Router setup
├── TinaApp.jsx                # Admin application
├── main.tsx                   # Entry point
└── index.css                  # Global styles & theme variables
```

## Database Schema

### Tables

**tina_projects**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_email | TEXT | Owner identifier |
| name | TEXT | Project name |
| description | TEXT | Optional description |
| display_order | INTEGER | Sort order |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

**tina_images**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | Foreign key to project |
| filename | TEXT | Original filename |
| storage_path | TEXT | Path in Supabase Storage |
| thumbnail_path | TEXT | Thumbnail path |
| file_size | BIGINT | File size in bytes |
| mime_type | TEXT | MIME type |
| display_order | INTEGER | Sort order |
| created_at | TIMESTAMP | Upload date |

**tina_analytics**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | TEXT | Browser session identifier |
| project_id | UUID | Foreign key to project |
| image_id | UUID | Foreign key to image |
| image_filename | TEXT | Human-readable filename |
| started_at | TIMESTAMP | When the image was opened |
| duration_seconds | INTEGER | How long it was viewed |

### Storage

- **Bucket**: `tina-images`
- **Structure**: `{project_id}/{timestamp}-{filename}`
- **Thumbnails**: `{project_id}/thumbs/{timestamp}-{filename}.jpg`

## Infrastructure

### Hosting - Cloudflare Pages (Direct Upload)

The app is deployed on **Cloudflare Pages** as a direct upload project (no Git connection). Builds happen locally and are pushed via Wrangler CLI.

- **Pages project**: `pfluger-tina`
- **Production URL**: `pfluger-tina.pages.dev`
- **Custom domain**: `tina.pflugerarchitects.com`

#### How to deploy

Build locally, then push to Cloudflare:

```bash
npm run build
npx wrangler pages deploy dist --project-name=pfluger-tina --branch=main
```

Wrangler will prompt for Cloudflare login on first use. The `--branch=main` flag ensures it deploys to production (without it, you get a preview URL).

Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are read from your local `.env` at build time and baked into the output. They do not need to be set in the Cloudflare dashboard.

### DNS - Bluehost

DNS is managed through **Bluehost**. A CNAME record points the custom subdomain to Cloudflare Pages:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | tina | pfluger-tina.pages.dev | 4 Hours |

This routes `tina.pflugerarchitects.com` to the Cloudflare Pages deployment. Bluehost is DNS only - no backend or hosting runs there.

### Backend - Supabase

All backend services are provided by **Supabase** (no custom server):

- **Database**: PostgreSQL (tables: `tina_projects`, `tina_images`, `tina_analytics`)
- **File Storage**: `tina-images` bucket (public read, open write)
- **Auth**: Password-gated via hardcoded credentials in client code (no Supabase Auth)
- **RLS**: Open policies (`USING (true)`) on all tables

## Routes

| Path | Mode | Description |
|------|------|-------------|
| `/login` | - | Login screen |
| `/` | Admin | Project list and management |
| `/viewer` | Admin | Popup 360 viewer window |
| `/:project-name` | Client | Read-only image gallery |
| `/:project-name/360` | Client | Inline 360 viewer |

## Credits

- 360 viewing powered by [Pannellum](https://pannellum.org/)
- Icons by [Lucide](https://lucide.dev/)
