# TINA - 360 Image Viewer

A web application for viewing and managing 360-degree panoramic images. Organize images into projects, upload equirectangular images, and view them in an interactive panorama viewer.

## Features

- **Project Organization**: Create projects to organize your 360 images
- **Drag & Drop Upload**: Upload images by dragging them into the project view
- **Interactive Viewer**: Opens in a separate window for full-screen panorama viewing
- **TouchPad Controls**: Pan and zoom the 360 view from the main window
- **Thumbnail Navigation**: Browse through images with a thumbnail strip
- **Drag to Reorder**: Reorder images within a project
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Responsive Design**: Works on desktop and tablet devices

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
git clone https://github.com/your-username/tina-360-viewer.git
cd tina-360-viewer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the contents and run it in the SQL Editor
3. Go to **Settings > API** and copy your:
   - Project URL
   - Anon/Public key

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### Creating a Project

1. Click the **+** button next to the "TINA" title
2. Enter a project name
3. Click "Create"

### Uploading Images

1. Open a project by clicking on it
2. Drag and drop equirectangular 360 images onto the page
3. Or click "Upload images" to browse for files

### Viewing 360 Images

1. Click on any image thumbnail to open the viewer
2. A separate viewer window opens with the 360 panorama
3. Use the TouchPad in the main window to:
   - **Drag** to pan around the image
   - **Scroll** to zoom in/out
   - Click **thumbnails** to switch images
   - Use **arrow buttons** to navigate

### Reordering Images

- Hover over an image to see the drag handle (grip icon)
- Drag images to reorder them

### Deleting

- **Images**: Hover and click the red X button
- **Projects**: Hover over a project card and click the red X button

## Project Structure

```
src/
├── components/
│   ├── CreateProjectModal.jsx  # New project dialog
│   ├── SortableImageGrid.jsx   # Draggable image grid
│   ├── ThemeToggle.tsx         # Light/dark mode toggle
│   ├── TouchPad.jsx            # Pan/zoom controls
│   └── ViewerPage.jsx          # Pannellum 360 viewer
├── contexts/
│   └── ThemeContext.tsx        # Theme state management
├── lib/
│   └── supabase.ts             # Supabase client
├── utils/
│   └── api.js                  # API functions for projects/images
├── App.tsx                     # Router setup
├── TinaApp.jsx                 # Main application
├── main.tsx                    # Entry point
└── index.css                   # Global styles & theme variables
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

### Storage

- **Bucket**: `tina-images`
- **Structure**: `{project_id}/{timestamp}-{filename}`
- **Thumbnails**: `{project_id}/thumbs/{timestamp}-{filename}.jpg`

## Deployment

### Vercel

```bash
npm run build
# Deploy the dist/ folder
```

### Netlify

```bash
npm run build
# Deploy the dist/ folder
```

### Cloudflare Pages

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in dashboard

## Customization

### User Email

By default, the app uses `default@user.com` for the user identifier. To customize:

```javascript
import { setUserEmail } from './utils/api';

// Set on app initialization
setUserEmail('your-email@example.com');
```

### Theme Colors

Edit CSS variables in `src/index.css`:

```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #1d1d1f;
  /* ... */
}

.dark {
  --color-bg-primary: #000000;
  --color-text-primary: #f5f5f7;
  /* ... */
}
```

## License

MIT

## Credits

- 360 viewing powered by [Pannellum](https://pannellum.org/)
- Icons by [Lucide](https://lucide.dev/)
