declare global {
  interface Window {
    pannellum: any;
  }
}

export function loadPannellum(): Promise<any> {
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
}
