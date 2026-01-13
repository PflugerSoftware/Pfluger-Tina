import React, { useState, useEffect, useRef } from 'react';
import { Move } from 'lucide-react';

// Load Pannellum dynamically
const loadPannellum = () => {
  return new Promise((resolve) => {
    if (window.pannellum) {
      resolve(window.pannellum);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
    script.onload = () => resolve(window.pannellum);
    document.head.appendChild(script);
  });
};

const VIEWER_CHANNEL = 'tina-viewer';

export default function ViewerPage() {
  const [currentImage, setCurrentImage] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewerRef = useRef(null);
  const pannellumViewer = useRef(null);

  // Listen for messages from main window
  useEffect(() => {
    const channel = new BroadcastChannel(VIEWER_CHANNEL);

    channel.onmessage = (event) => {
      const { type, image, allImages: images, currentIndex: index, deltaYaw, deltaPitch, delta } = event.data;

      if (type === 'LOAD_IMAGE') {
        setCurrentImage(image);
        setAllImages(images || []);
        setCurrentIndex(index || 0);
      } else if (type === 'PAN') {
        if (pannellumViewer.current) {
          const currentYaw = pannellumViewer.current.getYaw();
          const currentPitch = pannellumViewer.current.getPitch();
          const newYaw = currentYaw + deltaYaw;
          const newPitch = Math.max(-85, Math.min(85, currentPitch + deltaPitch));
          pannellumViewer.current.lookAt(newPitch, newYaw, undefined, false);
        }
      } else if (type === 'ZOOM' && pannellumViewer.current) {
        const hfov = pannellumViewer.current.getHfov();
        const pitch = pannellumViewer.current.getPitch();
        const yaw = pannellumViewer.current.getYaw();
        pannellumViewer.current.lookAt(pitch, yaw, Math.max(30, Math.min(120, hfov + delta)), false);
      } else if (type === 'RESET' && pannellumViewer.current) {
        pannellumViewer.current.lookAt(0, 0, 100, true);
      }
    };

    return () => channel.close();
  }, []);

  // Initialize Pannellum viewer
  useEffect(() => {
    if (!currentImage?.url || !viewerRef.current) return;

    const initViewer = async () => {
      const pannellum = await loadPannellum();

      // Destroy existing viewer
      if (pannellumViewer.current) {
        pannellumViewer.current.destroy();
      }

      // Create new viewer - clean display only
      pannellumViewer.current = pannellum.viewer(viewerRef.current, {
        type: 'equirectangular',
        panorama: currentImage.url,
        autoLoad: true,
        showControls: false,
        hfov: 100,
        minHfov: 30,
        maxHfov: 120,
        pitch: 0,
        yaw: 0,
        mouseZoom: false,
        draggable: false,
        keyboardZoom: false,
        compass: false,
        haov: 360,
        vaov: 180,
      });
    };

    initViewer();

    return () => {
      if (pannellumViewer.current) {
        pannellumViewer.current.destroy();
      }
    };
  }, [currentImage?.url]);

  if (!currentImage) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ backgroundColor: '#000' }}
      >
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <Move className="w-9 h-9 text-white/40" />
          </div>
          <p className="text-xl font-semibold text-white/90">TINA Viewer</p>
          <p className="text-[13px] text-white/40 mt-2">Select an image from the main window</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen w-screen relative overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* Pannellum Viewer - Full screen, no controls */}
      <div ref={viewerRef} className="absolute inset-0" />
    </div>
  );
}
