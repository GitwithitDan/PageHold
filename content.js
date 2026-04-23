// PageHold - Content Script
(function() {
  'use strict';

  // Configuration
  const MAX_WAIT_TIME = 3000; // 3 seconds max hold
  const FADE_DURATION = 400;   // Fade out duration

  // Create overlay immediately
  const overlay = document.createElement('div');
  overlay.id = 'pagehold-overlay';
  overlay.innerHTML = `
    <div class="pagehold-container">
      <div class="pagehold-icon">
        <svg viewBox="0 0 24 24" width="32" height="32">
          <path d="M5 2h14M5 22h14M7 2v5l5 5-5 5v5M17 2v5l-5 5 5 5v5" 
                stroke="currentColor" fill="none" stroke-width="2" 
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="pagehold-progress">
        <div class="pagehold-bar"></div>
      </div>
      <div class="pagehold-label">Loading…</div>
    </div>
  `;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #pagehold-overlay {
      position: fixed;
      inset: 0;
      background: #f5f2eb;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity ${FADE_DURATION}ms ease;
    }
    #pagehold-overlay.fade-out {
      opacity: 0;
      pointer-events: none;
    }
    .pagehold-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    .pagehold-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #1e3a8a, #4c1d95);
      border-radius: 14px;
      display: grid;
      place-items: center;
      color: #a5b4fc;
      box-shadow: 0 0 40px rgba(99,102,241,0.28);
    }
    .pagehold-icon svg {
      animation: pagehold-rock 3s ease-in-out infinite;
    }
    @keyframes pagehold-rock {
      0%, 40% { transform: rotate(0deg); }
      50%, 90% { transform: rotate(180deg); }
      100% { transform: rotate(180deg); }
    }
    .pagehold-progress {
      width: 160px;
      height: 3px;
      background: rgba(10,10,15,0.08);
      border-radius: 99px;
      overflow: hidden;
    }
    .pagehold-bar {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #a78bfa);
      border-radius: 99px;
      animation: pagehold-progress 2s ease-in-out infinite;
    }
    @keyframes pagehold-progress {
      0% { width: 0%; }
      60% { width: 85%; }
      100% { width: 100%; }
    }
    .pagehold-label {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(10,10,15,0.28);
    }
  `;

  // Inject overlay and styles as early as possible
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.head.appendChild(style);
    });
  }

  if (document.body) {
    document.body.appendChild(overlay);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(overlay);
    });
  }

  // Remove overlay function
  function removeOverlay() {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, FADE_DURATION);
  }

  // Set maximum wait timeout
  const maxTimeout = setTimeout(removeOverlay, MAX_WAIT_TIME);

  // Listen for page ready states
  function checkReady() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      clearTimeout(maxTimeout);
      removeOverlay();
    }
  }

  // Check immediately
  checkReady();

  // Listen for state changes
  document.addEventListener('readystatechange', checkReady);
  window.addEventListener('load', () => {
    clearTimeout(maxTimeout);
    removeOverlay();
  });
})();
