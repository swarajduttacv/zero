
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * ENTRY POINT BOOTSTRAP
 */
console.log("ZeroGPT: Main module loaded.");

const init = () => {
  const container = document.getElementById('root');
  if (!container) {
    console.error("ZeroGPT: FATAL - Root container not found.");
    return;
  }

  try {
    console.log("ZeroGPT: Initializing React root...");
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("ZeroGPT: React tree rendered.");
  } catch (err) {
    console.error("ZeroGPT: Initialization error:", err);
    // Overwrite root with error UI if React fails to even start
    container.innerHTML = `
      <div style="background:#0f172a; color:#ef4444; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; font-family:sans-serif; text-align:center;">
        <h2 style="margin-bottom:10px;">Critical Startup Failure</h2>
        <pre style="background:#1e293b; padding:15px; border-radius:8px; font-size:12px; max-width:100%; overflow:auto; border:1px solid #dc2626; color:#f8fafc;">${err instanceof Error ? err.message : String(err)}</pre>
        <button onclick="window.location.reload()" style="margin-top:20px; background:#3b82f6; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer;">Retry Now</button>
      </div>
    `;
  }
};

// Global error listener for assets or runtime crashes
window.onerror = (message, source, lineno, colno, error) => {
  console.error("ZeroGPT: Caught global error:", { message, source, lineno, colno, error });
};

// Execute initialization
init();
