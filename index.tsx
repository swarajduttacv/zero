
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

// GLOBAL ERROR HANDLER: Catch errors that happen before React mounts
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  // If the root is still showing the loading spinner (hasn't been cleared by React), show the error
  if (root) {
     console.error("Global Crash:", event.error);
     // We only replace content if React hasn't taken over (React clears innerHTML usually)
     // But strictly speaking, we just want to ensure the user sees the error.
     // We'll append a fixed overlay.
     const errorDiv = document.createElement('div');
     errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;color:#ef4444;padding:40px;z-index:9999;overflow:auto;font-family:monospace;';
     errorDiv.innerHTML = `
        <h1 style="font-size:24px;margin-bottom:20px;">Startup Error</h1>
        <p style="color:#cbd5e1;margin-bottom:20px;">The application failed to initialize properly.</p>
        <div style="background:#1e293b;padding:20px;border-radius:8px;border:1px solid #dc2626;white-space:pre-wrap;">${event.error?.message || event.message || 'Unknown Error'}</div>
        <button onclick="localStorage.clear();window.location.reload()" style="margin-top:20px;padding:12px 24px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;">
            Reset Data & Retry
        </button>
     `;
     document.body.appendChild(errorDiv);
  }
});

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find root element");
}
