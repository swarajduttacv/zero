
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

console.log("ZeroGPT: Script execution started.");

const renderApp = () => {
  const container = document.getElementById('root');
  
  if (!container) {
    console.error("ZeroGPT: Critical - Could not find root container.");
    return;
  }

  try {
    console.log("ZeroGPT: Attempting to mount React application...");
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("ZeroGPT: Render command issued successfully.");
  } catch (error) {
    console.error("ZeroGPT: Failed to mount React app:", error);
    container.innerHTML = `
      <div style="height: 100vh; background: #0f172a; color: #ef4444; padding: 40px; font-family: sans-serif;">
        <h1 style="font-size: 24px; margin-bottom: 20px;">Startup Failure</h1>
        <p style="color: #94a3b8; margin-bottom: 20px;">The app failed to mount. This usually indicates a script loading error.</p>
        <pre style="background: #1e293b; padding: 20px; border-radius: 8px; overflow: auto; border: 1px solid #dc2626;">${error instanceof Error ? error.message : 'Unknown Mounting Error'}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry Loading</button>
      </div>
    `;
  }
};

// Handle global unhandled errors
window.addEventListener('error', (event) => {
  console.error("ZeroGPT: Global Error Caught:", event.error || event.message);
});

// Run the render
renderApp();
