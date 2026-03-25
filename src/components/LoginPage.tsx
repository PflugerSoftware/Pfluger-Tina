import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../utils/api';
import { validateLogin, PASSWORDS } from '../config/passwords';

interface Project {
  id: string;
  name: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState('pfluger');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(auth.mode === 'admin' ? '/' : '/client', { replace: true });
    }
  }, [auth.isAuthenticated, auth.mode, navigate]);

  // Load projects for dropdown
  useEffect(() => {
    const load = async () => {
      try {
        const data = await projectsAPI.getAll();
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = validateLogin(selectedId, password);

    if (!result.valid) {
      setError('Invalid password');
      return;
    }

    if (result.mode === 'admin') {
      auth.login('admin');
      navigate('/', { replace: true });
    } else {
      const project = projects.find(p => p.id === selectedId);
      const name = project?.name ?? 'Project';
      auth.login('client', selectedId, name);
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      navigate(`/${slug}`, { replace: true });
    }
  };

  // Filter dropdown to only show projects that have a password configured
  const availableProjects = projects.filter(p => p.id in PASSWORDS);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm"
      >
        {/* Title */}
        <div className="text-center mb-8">
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
            TINA
          </h1>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Dropdown */}
            <div>
              <label
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Sign in as
              </label>
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={(e) => { setSelectedId(e.target.value); setError(''); }}
                  disabled={loading}
                  className="w-full appearance-none rounded-xl px-4 py-2.5 pr-10 text-[15px] outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <option value="pfluger">Pfluger (Admin)</option>
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  className="w-full rounded-xl px-4 py-2.5 pl-10 text-[15px] outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    border: `1px solid ${error ? 'rgb(239, 68, 68)' : 'var(--color-border)'}`,
                  }}
                  autoFocus
                />
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[13px] font-medium"
                style={{ color: 'rgb(239, 68, 68)' }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={!password || loading}
              className="w-full py-2.5 rounded-xl text-white text-[15px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              Sign In
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
