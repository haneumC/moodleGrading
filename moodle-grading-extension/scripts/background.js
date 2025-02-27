chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_MOODLE_DATA') {
    sendResponse({ data: localStorage.getItem('moodleGradingData') });
  }
}); 