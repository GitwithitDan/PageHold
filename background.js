/**
 * PageHold — Background Service Worker
 * Handles messaging between popup and content scripts
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGEHOLD_TOGGLE') {
    // Broadcast to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: message.enabled ? 'PAGEHOLD_ENABLE' : 'PAGEHOLD_DISABLE'
        }).catch(() => {
          // Tab might not have content script injected yet
        });
      });
    });
  }
});
