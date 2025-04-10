// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if we're on a Moodle grading page
  if (tab.url && tab.url.includes('/mod/assign/view.php')) {
    // Inject our content script
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['scripts/content.js']
    }).catch(err => console.error('Failed to inject content script:', err));
  }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'error') {
    console.error('Error from content script:', request.error);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_MOODLE_DATA') {
    sendResponse({ data: localStorage.getItem('moodleGradingData') });
  }
}); 