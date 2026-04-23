/**
 * PageHold — Layout Stabilizer v1.3
 *
 * Changes from v1.2:
 * - Added multiple safety mechanisms to prevent stuck overlay
 * - Fallback timers at 3s, 5s, and 8s (progressive safety net)
 * - Visibility change detection (tab switching forces reveal)
 * - User interaction detection (click/key forces reveal after 2s)
 * - MutationObserver for DOM changes (detects heavy rendering)
 * - Performance observer for layout stability
 */

(function PageHold() {
  'use strict';

  // ── Skip non-content pages ──────────────────────────────────────────────
  const proto = location.protocol;
  if (proto !== 'http:' && proto !== 'https:') return;

  // ── Skip localhost / local dev automatically ────────────────────────────
  const host = location.hostname;
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.localhost')
  ) return;

  // ── Check if user has disabled PageHold ────────────────────────────────
  const DISABLED_KEY = 'pagehold_disabled';
  if (localStorage.getItem(DISABLED_KEY) === '1') return;

  // ── Configuration ───────────────────────────────────────────────────────
  const TIMERS = {
    PRIMARY: 3000,      // Primary timeout (normal case)
    SECONDARY: 5000,    // Secondary safety net
    ABSOLUTE: 8000      // Absolute maximum hold time
  };

  let revealed = false;
  let overlayElement = null;
  let progress = 0;
  let rafId = null;

  // ── 1. Inject overlay as soon as <body> exists ──────────────────────────
  function createOverlay() {
    if (document.getElementById('pagehold-overlay')) return;
    
    overlayElement = document.createElement('div');
    overlayElement.id = 'pagehold-overlay';
    overlayElement.innerHTML = `
      <div class="pagehold-logo">
        <svg viewBox="0 0 24 24">
          <path d="M5 2h14M5 22h14M7 2v5l5 5-5 5v5M17 2v5l-5 5 5 5v5"/>
        </svg>
      </div>
      <div class="pagehold-bar-wrap">
        <div class="pagehold-bar" id="pagehold-bar"></div>
      </div>
      <div class="pagehold-label" id="pagehold-label">Waiting for page…</div>
    `;
    
    (document.body || document.documentElement).prepend(overlayElement);
  }

  if (document.body) {
    createOverlay();
  } else {
    new MutationObserver((_, obs) => {
      if (document.body) { 
        createOverlay(); 
        obs.disconnect(); 
      }
    }).observe(document.documentElement, { childList: true });
  }

  // ── 2. Progress simulation ──────────────────────────────────────────────
  function setProgress(pct, label) {
    progress = Math.max(progress, pct);
    const bar = document.getElementById('pagehold-bar');
    const lbl = document.getElementById('pagehold-label');
    if (bar) bar.style.width = progress + '%';
    if (lbl && label) lbl.textContent = label;
  }

  function startCrawl(target) {
    cancelAnimationFrame(rafId);
    let fake = progress;
    function tick() {
      if (fake < target && !revealed) {
        fake += (target - fake) * 0.05;
        setProgress(fake);
        rafId = requestAnimationFrame(tick);
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  startCrawl(60);

  // ── 3. Reveal function with safety checks ───────────────────────────────
  function reveal(reason = 'unknown') {
    if (revealed) return;
    revealed = true;
    
    // Cancel all timers and animations
    cancelAnimationFrame(rafId);
    clearTimeout(primaryTimer);
    clearTimeout(secondaryTimer);
    clearTimeout(absoluteTimer);
    
    // Disconnect observers
    if (mutationObs) mutationObs.disconnect();
    if (perfObs) perfObs.disconnect();
    
    setProgress(100, 'Ready');

    setTimeout(() => {
      const overlay = document.getElementById('pagehold-overlay');
      if (overlay) {
        overlay.classList.add('pagehold-reveal');
        overlay.addEventListener('transitionend', () => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, { once: true });
        
        // Backup removal in case transitionend doesn't fire
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 500);
      }
    }, 180);
  }

  // ── 4. Multiple safety timers (progressive fallback) ────────────────────
  const primaryTimer = setTimeout(() => {
    if (!revealed) {
      setProgress(100, 'Ready');
      reveal('primary-timeout');
    }
  }, TIMERS.PRIMARY);

  const secondaryTimer = setTimeout(() => {
    if (!revealed) {
      console.warn('[PageHold] Secondary timeout triggered');
      reveal('secondary-timeout');
    }
  }, TIMERS.SECONDARY);

  const absoluteTimer = setTimeout(() => {
    if (!revealed) {
      console.error('[PageHold] Absolute timeout triggered - forcing reveal');
      reveal('absolute-timeout');
    }
  }, TIMERS.ABSOLUTE);

  // ── 5. DOM ready detection ──────────────────────────────────────────────
  if (document.readyState !== 'loading') {
    // DOM already ready
    reveal('dom-already-ready');
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      setProgress(80, 'Almost ready…');
      reveal('dom-content-loaded');
    }, { once: true });
  }

  // ── 6. Visibility change detection (tab switching) ──────────────────────
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !revealed) {
      // User switched back to tab - reveal immediately
      reveal('visibility-change');
    }
  }, { once: true });

  // ── 7. User interaction detection ───────────────────────────────────────
  let interactionTimer = null;
  
  function handleInteraction() {
    if (revealed) return;
    
    // User is trying to interact - give page 2 more seconds then reveal
    if (!interactionTimer) {
      interactionTimer = setTimeout(() => {
        if (!revealed) {
          reveal('user-interaction');
        }
      }, 2000);
    }
  }

  document.addEventListener('click', handleInteraction, { once: true, capture: true });
  document.addEventListener('keydown', handleInteraction, { once: true, capture: true });

  // ── 8. MutationObserver for heavy DOM changes ───────────────────────────
  let mutationObs = null;
  let mutationCount = 0;
  
  if (document.body) {
    mutationObs = new MutationObserver(() => {
      mutationCount++;
      // If we see 50+ mutations, page is actively rendering - check if we should reveal
      if (mutationCount > 50 && !revealed) {
        setProgress(70, 'Rendering…');
      }
      // At 100+ mutations, assume page is mostly ready
      if (mutationCount > 100 && !revealed) {
        reveal('mutation-threshold');
      }
    });
    
    mutationObs.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // ── 9. Performance observer for layout stability ────────────────────────
  let perfObs = null;
  
  if ('PerformanceObserver' in window) {
    try {
      perfObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        // If we detect layout shift entries, page is stabilizing
        if (entries.length > 0 && !revealed) {
          setProgress(75, 'Stabilizing…');
        }
      });
      
      perfObs.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // PerformanceObserver not supported or layout-shift not available
    }
  }

  // ── 10. Listen for popup toggle ─────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PAGEHOLD_DISABLE') {
      localStorage.setItem(DISABLED_KEY, '1');
      reveal('user-disabled');
    }
    if (msg.type === 'PAGEHOLD_ENABLE') {
      localStorage.removeItem(DISABLED_KEY);
    }
  });

})();
