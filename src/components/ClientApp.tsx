import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { imagesAPI } from '../utils/api';
import ImageGallery from './ImageGallery';
import DesktopView from './DesktopView';

interface Image {
  id: string;
  filename: string;
  file_path: string;
  thumbnail_path?: string;
}

export default function ClientApp() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const isViewerMode = location.pathname.endsWith('/360');
  const projectSlug = (auth.projectName ?? 'project').toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    if (!auth.projectId) return;

    const load = async () => {
      try {
        const data = await imagesAPI.getByProject(auth.projectId!);
        setImages(data);
      } catch (err) {
        console.error('Failed to load images:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth.projectId]);

  const handleImageClick = (_image: Image, index: number) => {
    setSelectedIndex(index);
    navigate(`/${projectSlug}/360`);
  };

  const handleBackToGallery = () => {
    navigate(`/${projectSlug}`);
  };

  // DesktopView is full-screen, renders its own header
  if (isViewerMode && images.length > 0) {
    return (
      <DesktopView
        images={images}
        initialIndex={selectedIndex}
        projectId={auth.projectId!}
        projectName={auth.projectName ?? 'Project'}
        onBack={handleBackToGallery}
      />
    );
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div />
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={auth.logout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-[13px] font-medium"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </motion.button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="px-8 pb-12">
        {/* Title */}
        <div className="flex items-center justify-center mb-6">
          <h1
            className="cursor-default transition-colors duration-300"
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
              fontSize: '48px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
            }}
          >
            {auth.projectName ?? 'Project'}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-24"
            >
              <p className="text-[15px]" style={{ color: 'var(--color-text-tertiary)' }}>
                Loading images...
              </p>
            </motion.div>
          ) : images.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-24"
            >
              <p className="text-[15px]" style={{ color: 'var(--color-text-tertiary)' }}>
                No images in this project
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ImageGallery
                images={images}
                selectedIndex={isViewerMode ? selectedIndex : null}
                onImageClick={handleImageClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
