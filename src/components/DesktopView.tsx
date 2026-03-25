import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { loadPannellum } from '../utils/pannellum';
import { getImageUrl, getThumbnailUrl } from '../utils/api';
import { logImageView, updateViewDuration } from '../utils/analytics';

interface Image {
  id: string;
  filename: string;
  file_path: string;
  thumbnail_path?: string;
}

interface DesktopViewProps {
  images: Image[];
  initialIndex: number;
  projectId: string;
  projectName: string;
  onBack: () => void;
}

export default function DesktopView({ images, initialIndex, projectId, projectName, onBack }: DesktopViewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pannellumViewer = useRef<any>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<{ id: string; startTime: number } | null>(null);

  const currentImage = images[currentIndex];

  // Analytics: log view on image change, update duration on leave
  useEffect(() => {
    if (!currentImage) return;

    const startTime = Date.now();

    logImageView(projectId, currentImage.id, currentImage.filename).then(id => {
      if (id) {
        analyticsRef.current = { id, startTime };
      }
    });

    return () => {
      if (analyticsRef.current) {
        const seconds = (Date.now() - analyticsRef.current.startTime) / 1000;
        updateViewDuration(analyticsRef.current.id, seconds);
        analyticsRef.current = null;
      }
    };
  }, [currentIndex, currentImage, projectId]);

  // Initialize/update Pannellum viewer when image changes
  useEffect(() => {
    if (!currentImage || !viewerRef.current) return;

    const imageUrl = getImageUrl(currentImage.file_path);

    const initViewer = async () => {
      const pannellum = await loadPannellum();

      if (pannellumViewer.current) {
        pannellumViewer.current.destroy();
      }

      pannellumViewer.current = pannellum.viewer(viewerRef.current, {
        type: 'equirectangular',
        panorama: imageUrl,
        autoLoad: true,
        showControls: false,
        hfov: 100,
        minHfov: 30,
        maxHfov: 120,
        pitch: 0,
        yaw: 0,
        mouseZoom: true,
        draggable: true,
        keyboardZoom: true,
        compass: false,
        haov: 360,
        vaov: 180,
      });
    };

    initViewer();

    return () => {
      if (pannellumViewer.current) {
        pannellumViewer.current.destroy();
        pannellumViewer.current = null;
      }
    };
  }, [currentIndex, currentImage]);

  // Scroll current thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current && images.length > 0) {
      const thumbnails = thumbnailsRef.current.querySelectorAll('[data-thumbnail]');
      if (thumbnails[currentIndex]) {
        thumbnails[currentIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentIndex, images.length]);

  const goToImage = (index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  };

  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-[13px] font-medium"
            style={{
              background: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Gallery</span>
          </motion.button>
          <span
            className="text-[15px] font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {projectName}
          </span>
        </div>
        {images.length > 1 && (
          <span
            className="text-[13px] font-medium tabular-nums"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {currentIndex + 1} / {images.length}
          </span>
        )}
      </header>

      {/* Pannellum viewer */}
      <div className="flex-1 relative min-h-0" style={{ backgroundColor: '#000' }}>
        <div ref={viewerRef} className="absolute inset-0" />
      </div>

      {/* Thumbnail strip */}
      <div
        className="p-4 flex-shrink-0"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Prev arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => goToImage(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          {/* Scrollable thumbnails */}
          <div
            ref={thumbnailsRef}
            className="flex-1 flex gap-2 overflow-x-auto py-2 px-1 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--color-border) transparent',
            }}
          >
            {images.map((image, index) => (
              <motion.button
                key={image.id}
                data-thumbnail
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => goToImage(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'ring-3 ring-blue-500 ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={getThumbnailUrl(image)}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {index === currentIndex && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      boxShadow: 'inset 0 0 0 2px rgba(59, 130, 246, 0.5)',
                      borderRadius: '0.75rem',
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Next arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => goToImage(currentIndex + 1)}
            disabled={currentIndex >= images.length - 1}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
