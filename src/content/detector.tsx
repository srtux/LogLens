import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import '../styles/terminal.css';

// Function to detect if the page contains a raw JSON array
function detectAndMount() {
  // 1. Check Content-Type header (not easily accessible in content script without webRequest, 
  // so we rely on DOM structure mostly).
  // Chrome often wraps raw JSON in a <pre> tag or just puts it in body.
  
  const bodyText = document.body.innerText.trim();
  
  // Quick check: does it start with [ and end with ]?
  if (bodyText.startsWith('[') && bodyText.endsWith(']')) {
    try {
      // We won't parse the whole thing here to save performance, 
      // just check the first few chars to be reasonably sure.
      // Or we can just let the App component handle the parsing error.
      
      console.log('CloudLog Term: JSON array detected. Mounting UI...');
      mountApp();
    } catch (e) {
      // Not valid JSON
    }
  }
}

function mountApp() {
  // Clear existing body content (optional, or overlay it)
  // For a "viewer" extension, replacing the body content is usually expected.
  // However, to be safe and allow "exit", we might want to hide it instead.
  // For MVP, we'll create a root div that covers everything.

  const rootId = 'cloudlog-term-root';
  if (document.getElementById(rootId)) return; // Already mounted

  const rootDiv = document.createElement('div');
  rootDiv.id = rootId;
  document.body.appendChild(rootDiv);

  // Hide the original content to prevent scrollbar duplication/mess
  // We wrap original children in a div if not already? 
  // Actually, since we are fixed positioning the rootDiv over everything, 
  // we just need to suppress the body scroll.
  document.body.style.overflow = 'hidden';

  const root = createRoot(rootDiv);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Run detection on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectAndMount);
} else {
  detectAndMount();
}
