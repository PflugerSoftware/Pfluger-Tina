import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateProjectModal({ isOpen, onClose, onCreateProject }) {
  const [projectName, setProjectName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setProjectName('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      onCreateProject(projectName.trim());
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm rounded-3xl p-6 backdrop-blur-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-lg font-semibold mb-1 text-center"
              style={{ color: '#1d1d1f' }}
            >
              New Project
            </h2>
            <p className="text-sm mb-5 text-center" style={{ color: '#86868b' }}>
              Create a new 360 image collection
            </p>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full px-4 py-3.5 rounded-xl mb-5 outline-none transition-all text-[15px]"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  color: '#1d1d1f',
                  border: '1px solid transparent',
                }}
                onFocus={(e) => e.target.style.border = '1px solid rgba(0, 122, 255, 0.5)'}
                onBlur={(e) => e.target.style.border = '1px solid transparent'}
              />

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-[15px] font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: '#1d1d1f',
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!projectName.trim()}
                  className="flex-1 py-3 rounded-xl text-[15px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  Create
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
