import { motion } from 'framer-motion';
import { getThumbnailUrl } from '../utils/api';

interface Image {
  id: string;
  filename: string;
  file_path: string;
  thumbnail_path?: string;
}

interface ImageGalleryProps {
  images: Image[];
  selectedIndex: number | null;
  onImageClick: (image: Image, index: number) => void;
}

export default function ImageGallery({ images, selectedIndex, onImageClick }: ImageGalleryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02, type: 'spring', damping: 25, stiffness: 300 }}
          className="aspect-square relative group"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onImageClick(image, index)}
            className={`w-full h-full rounded-2xl overflow-hidden cursor-pointer transition-shadow ${
              selectedIndex === index
                ? 'ring-2 ring-blue-500 ring-offset-2'
                : ''
            } shadow-sm hover:shadow-lg`}
          >
            <div
              className="w-full h-full"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <img
                src={getThumbnailUrl(image)}
                alt={image.filename}
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
              />
            </div>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />

            {selectedIndex === index && (
              <div
                className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full backdrop-blur-md text-white text-[10px] font-medium"
                style={{ background: 'rgba(0, 122, 255, 0.9)' }}
              >
                Viewing
              </div>
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
