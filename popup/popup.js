/**
 * PageHold — Popup Controller
 */

const toggle = document.getElementById('toggle');

// Load saved state
chrome.storage.local.get(['pagehold_enabled'], (result) => {
  const enabled = result.pagehold_enabled !== false; // Default to true
  toggle.classList.toggle('active', enabled);
});

// Handle toggle click
toggle.addEventListener('click', () => {
  const isActive = toggle.classList.contains('active');
  const newState = !isActive;
  
  toggle.classList.toggle('active', newState);
  
  // Save state
  chrome.storage.local.set({ pagehold_enabled: newState });
  
  // Notify background script
  chrome.runtime.sendMessage({
    type: 'PAGEHOLD_TOGGLE',
    enabled: newState
  });
});
