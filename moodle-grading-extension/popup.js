document.getElementById('openTest').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('build/index.html') });
}); 