// Function to check if we're on a grading page
function isGradingPage() {
  // More specific check for grading page
  return window.location.href.includes('action=grading') && 
         document.querySelector('.generaltable') !== null;
}

// Function to collect grading data from the page
function collectGradingData() {
  const data = {
    assignmentName: '',
    studentData: []
  };

  // Get assignment name
  const assignmentTitle = document.querySelector('.page-header-headings h1');
  if (assignmentTitle) {
    data.assignmentName = assignmentTitle.textContent.trim();
  }

  // Get all student rows
  const rows = document.querySelectorAll('table.generaltable > tbody > tr');
  rows.forEach(row => {
    try {
      // Get name from first cell
      const nameCell = row.querySelector('td');
      if (!nameCell) return;
      
      const nameText = nameCell.textContent.trim().replace('Select', '').trim();
      if (!nameText) return;

      // Get email
      let emailText = '';
      const cells = row.querySelectorAll('td');
      for (const cell of cells) {
        const text = cell.textContent.trim();
        if (text.includes('@bobeldyk.us') || text.includes('@calvin.edu')) {
          emailText = text;
          break;
        }
      }

      // Get grade and feedback
      let gradeText = '';
      let feedbackText = '';

      // Look for grade input
      const gradeInput = row.querySelector('input[id*="quickgrade"]');
      if (gradeInput) {
        gradeText = gradeInput.value || '';
      }

      // Look for feedback textarea
      const feedbackArea = row.querySelector('textarea[id*="quickgrade"]');
      if (feedbackArea) {
        feedbackText = feedbackArea.value || '';
      }

      // Add to data if we have at least a name
      if (nameText) {
        data.studentData.push({
          name: nameText,
          email: emailText,
          grade: gradeText,
          feedback: feedbackText,
          appliedIds: []
        });
      }
    } catch (err) {
      console.error('Error processing row:', err);
    }
  });

  return data;
}

// Function to create Submit button
function createSubmitButton() {
  const button = document.createElement('button');
  button.className = 'btn btn-primary submit-grades-btn';
  button.style.cssText = `
    background-color: #4CAF50;
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    margin: 10px 0;
    cursor: pointer;
    transition: background-color 0.2s;
  `;
  
  button.textContent = 'Submit';
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#45a049';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#4CAF50';
  });

  button.addEventListener('click', () => {
    // Find and click the original Moodle submit button
    const moodleSubmitBtn = document.querySelector('input[name="savechanges"]');
    if (moodleSubmitBtn) {
      moodleSubmitBtn.click();
    } else {
      alert('Submit button not found on the page');
    }
  });

  return button;
}

// Function to add the button to the page
function addGradingButton() {
  // Check if button already exists
  if (document.querySelector('.moodle-grading-btn')) {
    return;
  }

  // Create container for buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
    margin: 10px 0;
  `;

  // Create the grading button
  const gradingBtn = document.createElement('button');
  gradingBtn.textContent = 'Open Moodle Grading';
  gradingBtn.className = 'btn btn-primary moodle-grading-btn';
  gradingBtn.style.cssText = `
    background-color: #0f6cbf;
    border: none;
    padding: 7px 12px;
    border-radius: 4px;
    color: white;
    cursor: pointer;
  `;

  // Add click handler for grading button
  gradingBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = collectGradingData();
      if (!data.studentData.length) {
        alert('No student data found.');
        return;
      }
      const encodedData = encodeURIComponent(JSON.stringify(data));
      window.open(`https://haneumc.github.io/moodleGrading/?data=${encodedData}`, '_blank');
    } catch (error) {
      console.error('Error:', error);
      alert('Error collecting data. Please check the console for details.');
    }
  });

  // Create submit button
  const submitBtn = createSubmitButton();

  // Add buttons to container
  buttonContainer.appendChild(gradingBtn);
  buttonContainer.appendChild(submitBtn);

  // Find the grading action dropdown
  const gradingDropdown = document.querySelector('select[name="jump"]');
  if (gradingDropdown) {
    // Insert the button container right after the dropdown
    gradingDropdown.insertAdjacentElement('afterend', buttonContainer);
    return;
  }

  // Fallback - add to the top of the grading table
  const gradingTable = document.querySelector('.generaltable');
  if (gradingTable) {
    gradingTable.parentElement.insertBefore(buttonContainer, gradingTable);
  }
}

// Initialize when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addGradingButton);
} else {
  addGradingButton();
}

// Function to create and style the button
function createGradingButton() {
  const button = document.createElement('button');
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
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#2563eb';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#3b82f6';
  });

  button.addEventListener('click', launchGradingAssistant);
  return button;
}

// Function to launch the grading assistant
function launchGradingAssistant() {
  try {
    const data = collectGradingData();
    console.log('Raw collected data:', data);
    
    if (!data.studentData.length) {
      console.error('No student data was collected');
      alert('Unable to collect student data. Please check if you are on the correct page.');
      return;
    }

    const storageData = {
      assignmentName: data.assignmentName,
      students: data.studentData.map(student => ({
        name: student.name,
        email: student.email,
        grade: student.grade || '',
        feedback: student.feedback || '',
        appliedIds: []
      })),
      timestamp: new Date().toISOString()
    };

    // Use URL parameters instead of Chrome storage
    const encodedData = encodeURIComponent(JSON.stringify(storageData));
    window.open(`${chrome.runtime.getURL('build/index.html')}?data=${encodedData}`, '_blank');

  } catch (error) {
    console.error('Error launching grading assistant:', error);
    alert('An error occurred while collecting data. Please check the console for details.');
  }
}

// Initialize
function init() {
  console.log('Initializing Moodle Grading Assistant...');
  if (!isGradingPage()) {
    console.log('Not a grading page, skipping initialization');
    return;
  }

  console.log('Found grading page, adding button...');
  // Look for the select element with the specific class and name
  const dropdown = document.querySelector('select[name="jump"]');
  
  if (dropdown) {
    addGradingButton();  // Use the working button implementation
    console.log('Button added successfully');
  } else {
    console.error('Could not find dropdown element');
  }
}

init();

// Watch for page changes
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