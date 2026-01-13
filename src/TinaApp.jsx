import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, ExternalLink, X } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { projectsAPI, imagesAPI, getImageUrl } from './utils/api';
import CreateProjectModal from './components/CreateProjectModal';
import TouchPad from './components/TouchPad';
import SortableImageGrid from './components/SortableImageGrid';

// Message channel for communicating with popup viewer
const VIEWER_CHANNEL = 'tina-viewer';

function TinaApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [viewerWindow, setViewerWindow] = useState(null);
  const dragCounter = useRef(0);

  // Parse URL hash for navigation
  useEffect(() => {
    const hash = location.hash;
    if (hash.startsWith('#project-')) {
      const projectId = hash.replace('#project-', '');
      setActiveProjectId(projectId);
      setCurrentView('project');
      loadProjectImages(projectId);
    } else {
      setCurrentView('home');
      setActiveProjectId(null);
    }
  }, [location.hash]);

  useEffect(() => {
    loadProjectsFromAPI();
  }, []);

  // Check if viewer window is still open
  useEffect(() => {
    const checkWindow = setInterval(() => {
      if (viewerWindow && viewerWindow.closed) {
        setViewerWindow(null);
      }
    }, 1000);
    return () => clearInterval(checkWindow);
  }, [viewerWindow]);

  const loadProjectsFromAPI = async () => {
    try {
      const projectsData = await projectsAPI.getAll();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectImages = async (projectId) => {
    try {
      const imagesData = await imagesAPI.getByProject(projectId);
      setProjects(prev =>
        prev.map(project =>
          project.id == projectId
            ? { ...project, images: imagesData }
            : project
        )
      );
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const navigateToProject = (projectId) => {
    navigate(`/#project-${projectId}`, { replace: true });
  };

  const navigateToHome = () => {
    navigate('/', { replace: true });
    loadProjectsFromAPI();
  };

  const handleCreateProject = async (name) => {
    try {
      const newProject = await projectsAPI.create(name);
      setProjects(prev => [...prev, { ...newProject, images: [] }]);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (projects.length === 1) {
      alert('Cannot delete the last project.');
      return;
    }
    if (!confirm('Delete this project and all its images?')) return;
    try {
      await projectsAPI.delete(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await imagesAPI.delete(imageId);
      setProjects(prev =>
        prev.map(project =>
          project.id === activeProjectId
            ? { ...project, images: project.images.filter(img => img.id !== imageId) }
            : project
        )
      );
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !activeProjectId) return;
    try {
      await imagesAPI.upload(activeProjectId, files);
      loadProjectImages(activeProjectId);
    } catch (error) {
      console.error('Failed to upload:', error);
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    if (!activeProjectId) return;

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (!files.length) return;

    try {
      await imagesAPI.upload(activeProjectId, files);
      loadProjectImages(activeProjectId);
    } catch (error) {
      console.error('Failed to upload:', error);
    }
  };

  const openViewerWindow = useCallback(() => {
    if (viewerWindow && !viewerWindow.closed) {
      viewerWindow.focus();
      return viewerWindow;
    }

    const width = 1200;
    const height = 800;
    const left = window.screenX + 100;
    const top = window.screenY + 100;

    const newWindow = window.open(
      '/viewer',
      'tina-viewer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    );

    setViewerWindow(newWindow);
    return newWindow;
  }, [viewerWindow]);

  const sendToViewer = useCallback((data) => {
    // Use BroadcastChannel for cross-window communication
    const channel = new BroadcastChannel(VIEWER_CHANNEL);
    channel.postMessage(data);
    channel.close();
  }, []);

  const handleImageClick = (image, index) => {
    setSelectedImageIndex(index);
    const win = openViewerWindow();

    // Wait for window to be ready, then send image
    setTimeout(() => {
      const activeProject = projects.find(p => p.id === activeProjectId);
      sendToViewer({
        type: 'LOAD_IMAGE',
        image: {
          ...image,
          url: getImageUrl(image.file_path),
        },
        allImages: activeProject?.images?.map(img => ({
          ...img,
          url: getImageUrl(img.file_path),
        })) || [],
        currentIndex: index,
      });
    }, 500);
  };

  const goToImage = useCallback((index) => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (!activeProject?.images || index < 0 || index >= activeProject.images.length) return;

    const image = activeProject.images[index];
    setSelectedImageIndex(index);

    sendToViewer({
      type: 'LOAD_IMAGE',
      image: {
        ...image,
        url: getImageUrl(image.file_path),
      },
      allImages: activeProject.images.map(img => ({
        ...img,
        url: getImageUrl(img.file_path),
      })),
      currentIndex: index,
    });
  }, [projects, activeProjectId, sendToViewer]);

  const handlePrevImage = useCallback(() => {
    if (selectedImageIndex > 0) {
      goToImage(selectedImageIndex - 1);
    }
  }, [selectedImageIndex, goToImage]);

  const handleNextImage = useCallback(() => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (activeProject?.images && selectedImageIndex < activeProject.images.length - 1) {
      goToImage(selectedImageIndex + 1);
    }
  }, [selectedImageIndex, projects, activeProjectId, goToImage]);

  const handleReorderImages = async (newOrder) => {
    // Update local state immediately
    setProjects(prev =>
      prev.map(project =>
        project.id === activeProjectId
          ? { ...project, images: newOrder }
          : project
      )
    );

    // Persist to database
    try {
      await imagesAPI.reorder(newOrder);
    } catch (error) {
      console.error('Failed to reorder images:', error);
      // Reload to restore correct order on error
      loadProjectImages(activeProjectId);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {currentView === 'project' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={navigateToHome}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-[13px] font-medium"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span>← Projects</span>
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentView === 'project' && (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openViewerWindow}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-[13px] font-medium"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-secondary)',
                }}
                title="Open Viewer Window"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Viewer</span>
              </motion.button>
              {viewerWindow && !viewerWindow.closed && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    viewerWindow.close();
                    setViewerWindow(null);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all text-[13px] font-medium"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'rgb(239, 68, 68)',
                  }}
                  title="Close Viewer Window"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </motion.button>
              )}
            </>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="px-8 pb-12">
        {/* Title */}
        <div className="flex items-center justify-center gap-3 mb-6">
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
            {currentView === 'home' ? 'TINA' : activeProject?.name || 'Project'}
          </h1>
          {currentView === 'home' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all"
              style={{
                background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Project View */}
          {currentView === 'project' && activeProject && (
            <motion.div
              key="project"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative min-h-[300px]"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag Overlay */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '2px dashed rgba(59, 130, 246, 0.5)',
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      >
                        <Upload className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-base font-medium text-blue-500">
                        Drop 360 images here
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!activeProject.images?.length ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    <Upload className="w-7 h-7" style={{ color: 'var(--color-text-tertiary)' }} />
                  </div>
                  <p className="mb-1.5 text-[15px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Drop 360 images here
                  </p>
                  <p className="mb-5 text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>
                    or click to browse
                  </p>
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 text-white rounded-xl text-[15px] font-medium transition-all cursor-pointer"
                    style={{
                      background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    Upload images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </motion.label>
                </div>
              ) : (
                <SortableImageGrid
                  images={activeProject.images}
                  selectedIndex={selectedImageIndex}
                  onImageClick={handleImageClick}
                  onDeleteImage={handleDeleteImage}
                  onReorder={handleReorderImages}
                />
              )}
            </motion.div>
          )}

          {/* Home View - Projects */}
          {currentView === 'home' && (
            <motion.div
              key="projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <p className="mb-5 text-[15px]" style={{ color: 'var(--color-text-tertiary)' }}>
                    No projects yet
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 text-white rounded-xl text-[15px] font-medium transition-all"
                    style={{
                      background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    Create your first project
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03, type: 'spring', damping: 25, stiffness: 300 }}
                      className="aspect-square relative group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.03, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigateToProject(project.id)}
                        className="w-full h-full rounded-2xl cursor-pointer overflow-hidden transition-shadow"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          <span className="text-base font-medium text-center px-4 leading-tight">
                            {project.name}
                          </span>
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors" />
                      </motion.div>
                      {/* Delete button */}
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10"
                        style={{
                          background: 'rgba(255, 59, 48, 0.9)',
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* TouchPad for controlling viewer */}
      <AnimatePresence>
        {viewerWindow && !viewerWindow.closed && selectedImageIndex !== null && (
          <TouchPad
            isViewerOpen={true}
            currentIndex={selectedImageIndex}
            totalImages={activeProject?.images?.length || 0}
            images={activeProject?.images || []}
            onPrev={handlePrevImage}
            onNext={handleNextImage}
            onSelectImage={goToImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TinaApp;
