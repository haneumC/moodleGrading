console.log('Content script loaded on:', window.location.href);

// Add this at the beginning of your content script
const isTestMode = true; // Set to true for testing

// Function to create and inject the UI
function createGradingUI(studentData) {
  console.log('Creating grading UI with data:', studentData);
  // Create a button to launch the grading interface
  const button = document.createElement('button');
  button.textContent = 'Open Grading Assistant';
  button.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: #4a5dab; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;';
  
  // Add click handler to open your app
  button.addEventListener('click', () => {
    // Create container for your app
    const container = document.createElement('div');
    container.id = 'moodle-grading-assistant-container';
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; justify-content: center; align-items: center;';
    
    // Create iframe to load your app
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('build/index.html');
    iframe.style.cssText = 'width: 90%; height: 90%; border: none; background: white;';
    container.appendChild(iframe);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; background: white; border: none; font-size: 20px; cursor: pointer;';
    closeBtn.addEventListener('click', () => container.remove());
    container.appendChild(closeBtn);
    
    document.body.appendChild(container);
    
    // Store student data in chrome.storage for the app to access
    chrome.storage.local.set({
      moodleGradingData: {
        students: studentData,
        assignmentName: 'Programming Assignment 1'
      }
    });
  });
  
  document.body.appendChild(button);
}

if (isTestMode) {
  // Create mock data for testing
  const mockStudentData = [
    { name: "John Doe", email: "john@example.com", submission: "function test() { return true; }", grade: "", feedback: "", appliedIds: [], status: "Not Started" },
    { name: "Jane Smith", email: "jane@example.com", submission: "class Example { }", grade: "", feedback: "", appliedIds: [], status: "Not Started" }
  ];
  
  // Call function to create UI with mock data
  createGradingUI(mockStudentData);
} else {
  // Normal production code
  // Extract data from Moodle page
  // ...
} 