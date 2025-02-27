// Function to check if we're on a grading page
function isGradingPage() {
  return window.location.href.includes('action=grading') || 
         document.querySelector('.gradingsummary') !== null;
}

// Function to create and style the button
function createGradingButton() {
  const button = document.createElement('button');
  
  // Style the button
  button.className = 'btn btn-primary grading-assistant-btn';
  button.style.cssText = `
    background-color: #3b82f6;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    margin: 10px 0;
    cursor: pointer;
    transition: background-color 0.2s;
  `;
  
  button.textContent = 'Open Moodle Grading';
  
  // Add hover effect
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#2563eb';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#3b82f6';
  });

  // Add click handler
  button.addEventListener('click', launchGradingAssistant);
  
  return button;
}

// Function to launch the grading assistant
function launchGradingAssistant() {
  // Get the assignment data
  const assignmentName = document.querySelector('h2').textContent.trim();
  const gradingTable = document.querySelector('.generaltable');
  const students = [];

  if (gradingTable) {
    const rows = gradingTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length) {
        students.push({
          name: cells[0].textContent.trim(),
          email: cells[1].textContent.trim(),
          status: cells[2].textContent.trim(),
          grade: cells[3].textContent.trim() || '',
          lastModifiedSubmission: cells[4].textContent.trim(),
          feedback: cells[5].textContent.trim() || '',
          appliedIds: []
        });
      }
    });
  }

  // Store the data
  localStorage.setItem('moodleGradingData', JSON.stringify({
    assignmentName,
    students,
    timestamp: new Date().toISOString()
  }));

  // Open the grading assistant in a new window
  window.open(
    chrome.runtime.getURL('index.html'),
    'GradingAssistant',
    'width=1200,height=800,menubar=no,toolbar=no'
  );
}

// Main initialization function
function init() {
  if (!isGradingPage()) return;

  // Find the insertion point
  const insertPoint = document.querySelector('.gradingsummary') || 
                     document.querySelector('h2');
  
  if (insertPoint) {
    const button = createGradingButton();
    insertPoint.insertAdjacentElement('afterend', button);
  }
}

// Run initialization
init();

// Watch for page changes (for single-page applications)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && !document.querySelector('.grading-assistant-btn')) {
      init();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 