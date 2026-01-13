import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200"
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 w-5 h-5"
          style={{
            color: isDark ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
          }}
          initial={false}
          animate={{
            scale: isDark ? 0.5 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? -90 : 0,
          }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </motion.svg>

        {/* Moon icon */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 w-5 h-5"
          style={{
            color: isDark ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          }}
          initial={false}
          animate={{
            scale: isDark ? 1 : 0.5,
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : 90,
          }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </motion.svg>
      </div>
    </button>
  );
}
