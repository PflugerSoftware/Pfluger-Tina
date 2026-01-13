import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Move, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getThumbnailUrl } from '../utils/api';

const VIEWER_CHANNEL = 'tina-viewer';

export default function TouchPad({
  isViewerOpen,
  currentIndex,
  totalImages,
  images = [],
  onPrev,
  onNext,
  onSelectImage
}) {
  const padRef = useRef(null);
  const thumbnailsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const channelRef = useRef(null);

  // Keep a persistent channel open
  useEffect(() => {
    channelRef.current = new BroadcastChannel(VIEWER_CHANNEL);
    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Scroll current thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current && images.length > 0) {
      const container = thumbnailsRef.current;
      const thumbnails = container.querySelectorAll('[data-thumbnail]');
      if (thumbnails[currentIndex]) {
        thumbnails[currentIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentIndex, images.length]);

  const sendToViewer = (data) => {
    if (channelRef.current) {
      channelRef.current.postMessage(data);
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('[data-thumbnail]')) return;
    setIsDragging(true);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;

    sendToViewer({
      type: 'PAN',
      deltaYaw: -deltaX * 0.5,
      deltaPitch: deltaY * 0.5,
    });

    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('[data-thumbnail]')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - lastPosition.current.x;
    const deltaY = e.touches[0].clientY - lastPosition.current.y;

    sendToViewer({
      type: 'PAN',
      deltaYaw: -deltaX * 0.3,
      deltaPitch: deltaY * 0.3,
    });

    lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    sendToViewer({ type: 'ZOOM', delta: -10 });
  };

  const handleZoomOut = () => {
    sendToViewer({ type: 'ZOOM', delta: 10 });
  };

  const handleReset = () => {
    sendToViewer({ type: 'RESET' });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    sendToViewer({ type: 'ZOOM', delta: e.deltaY > 0 ? 5 : -5 });
  };

  const handleThumbnailClick = (index) => {
    if (onSelectImage) {
      onSelectImage(index);
    }
  };

  if (!isViewerOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Main drag-to-pan area */}
      <div
        ref={padRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`flex-1 flex items-center justify-center cursor-grab select-none transition-colors ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={{
          backgroundColor: isDragging
            ? 'var(--color-bg-tertiary)'
            : 'var(--color-bg-secondary)',
        }}
      >
        <div className="text-center pointer-events-none">
          <Move
            className="w-16 h-16 mx-auto mb-4 transition-transform"
            style={{
              color: 'var(--color-text-tertiary)',
              transform: isDragging ? 'scale(1.2)' : 'scale(1)',
              opacity: isDragging ? 0.8 : 0.4,
            }}
          />
          <p
            className="text-2xl font-medium transition-opacity"
            style={{
              color: 'var(--color-text-tertiary)',
              opacity: isDragging ? 0.8 : 0.5,
            }}
          >
            {isDragging ? 'Panning...' : 'Drag to pan'}
          </p>
          <p
            className="text-sm mt-2"
            style={{ color: 'var(--color-text-tertiary)', opacity: 0.4 }}
          >
            Scroll to zoom
          </p>
        </div>
      </div>

      {/* Bottom control bar */}
      <div
        className="p-4"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {/* Thumbnail strip with arrows */}
        <div className="flex items-center gap-3 mb-3">
          {/* Prev arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronLeft className="w-6 h-6" />
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
                onClick={() => handleThumbnailClick(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'ring-3 ring-blue-500 ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  ringOffsetColor: 'var(--color-bg-primary)',
                }}
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
            onClick={onNext}
            disabled={currentIndex >= totalImages - 1}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Zoom and reset controls */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
            title="Reset view"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </motion.button>

          {/* Image counter */}
          {totalImages > 1 && (
            <span
              className="ml-4 text-sm font-medium tabular-nums"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {currentIndex + 1} / {totalImages}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
