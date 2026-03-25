# TINA - 360 Image Viewer

## Quick Reference

- **Dev server**: `npm run dev` (runs on http://localhost:5173)
- **Build**: `npm run build` (outputs to `dist/`)
- **Lint**: `npm run lint`

## Architecture

Static React SPA (no server-side code). The browser talks directly to Supabase.

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Supabase (Postgres DB + Storage bucket)
- **Hosting**: Cloudflare Pages (auto-deploys from `main` branch)
- **DNS**: Bluehost CNAME `tina` -> `pfluger-tina.pages.dev` (tina.pflugerarchitects.com)

## Two Modes

### Admin (Pfluger login)
- Full CRUD on projects and images
- TouchPad + popup viewer window (designed for touchscreen controlling a projector onto a semi-sphere)
- Files: `TinaApp.jsx`, `TouchPad.jsx`, `ViewerPage.jsx`, `SortableImageGrid.jsx`

### Client (Project login)
- Read-only, scoped to one project
- Inline Pannellum 360 viewer with mouse controls (no popup, no touchpad)
- Analytics tracking (session, image, duration)
- URLs: `/:project-name` (gallery), `/:project-name/360` (viewer)
- Files: `ClientApp.tsx`, `DesktopView.tsx`, `ImageGallery.tsx`

## Auth

Password-gated login. Credentials hardcoded in `src/config/passwords.ts`.
- `pfluger` key -> admin mode
- Project UUID keys -> client mode (only projects with a password entry appear in dropdown)
- Session persisted in localStorage (`tina-360-auth`)
- Auth state managed via `src/contexts/AuthContext.tsx`

## Key Files

- `src/App.tsx` - Routes and auth guards
- `src/TinaApp.jsx` - Admin app (project list, image grid, upload, viewer popup)
- `src/components/ClientApp.tsx` - Client shell (gallery/viewer toggle via URL)
- `src/components/DesktopView.tsx` - Inline 360 viewer with mouse controls + thumbnails
- `src/components/ViewerPage.jsx` - Admin popup 360 viewer (BroadcastChannel)
- `src/components/TouchPad.jsx` - Admin pan/zoom controls (BroadcastChannel)
- `src/components/LoginPage.tsx` - Login screen with project dropdown
- `src/components/ProtectedRoute.tsx` - Route guard
- `src/config/passwords.ts` - Hardcoded credentials
- `src/utils/api.js` - Supabase CRUD (projects, images)
- `src/utils/analytics.ts` - Client view tracking (inserts on view, updates duration on leave)
- `src/utils/pannellum.ts` - Shared Pannellum CDN loader (used by ViewerPage + DesktopView)
- `src/lib/supabase.ts` - Supabase client init

## Database

Three tables in Supabase Postgres:
- `tina_projects` - projects scoped by `user_email`
- `tina_images` - images linked to projects via `project_id` FK
- `tina_analytics` - client view tracking (session_id, image_id, duration_seconds)

Storage bucket: `tina-images` (public read, open write)

Migrations: `supabase/migrations/001_initial_schema.sql`, `002_analytics.sql`

## Environment Variables

Required in `.env` (not committed to git):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key

Must also be set in Cloudflare Pages dashboard for production builds.

## Communication Patterns

- **Admin mode**: BroadcastChannel (`tina-viewer`) for cross-window messaging between TouchPad/TinaApp and the popup ViewerPage
- **Client mode**: Direct Pannellum API calls within DesktopView (no cross-window communication)

## Notes

- RLS is fully open (`USING (true)`) on all tables
- Mix of .jsx and .tsx files; `allowJs: true` in tsconfig
- Pannellum loaded dynamically from CDN (v2.5.6)
- Session IDs for analytics generated per browser tab via `sessionStorage` + `crypto.randomUUID()`
