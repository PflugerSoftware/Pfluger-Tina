import React from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical } from 'lucide-react';
import { getThumbnailUrl } from '../utils/api';

function SortableImage({ image, index, selectedIndex, onClick, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, type: 'spring', damping: 25, stiffness: 300 }}
      className="aspect-square relative group"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full h-full rounded-2xl overflow-hidden cursor-pointer transition-shadow ${
          selectedIndex === index
            ? 'ring-2 ring-offset-2'
            : ''
        } ${isDragging ? 'shadow-2xl' : 'shadow-sm hover:shadow-lg'}`}
        style={{
          ringColor: 'rgba(0, 122, 255, 0.8)',
          ringOffsetColor: 'var(--color-bg-primary)',
          opacity: isDragging ? 0.9 : 1,
        }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-grab z-10"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Image (clickable) */}
        <div
          onClick={onClick}
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

        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10 hover:scale-110"
          style={{
            background: 'rgba(255, 59, 48, 0.9)',
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Selected indicator */}
        {selectedIndex === index && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full backdrop-blur-md text-white text-[10px] font-medium"
            style={{ background: 'rgba(0, 122, 255, 0.9)' }}
          >
            Viewing
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function SortableImageGrid({
  images,
  selectedIndex,
  onImageClick,
  onDeleteImage,
  onReorder,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      const newOrder = arrayMove(images, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <SortableImage
              key={image.id}
              image={image}
              index={index}
              selectedIndex={selectedIndex}
              onClick={() => onImageClick(image, index)}
              onDelete={onDeleteImage}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
