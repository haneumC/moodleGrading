// Simple listener to show the extension is active
chrome.runtime.onInstalled.addListener(() => {
  console.log('Moodle Grading Assistant installed');
});

// Open the app when the extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked');
  chrome.tabs.create({ url: chrome.runtime.getURL('build/index.html') });
}); 