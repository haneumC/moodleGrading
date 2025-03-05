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
    students: []
  };

  // Debug the page structure
  console.log('Starting data collection...');

  // Get assignment name from the page
  const assignmentTitle = document.querySelector('.page-header-headings h1, h2');
  console.log('Found title element:', assignmentTitle);
  if (assignmentTitle) {
    data.assignmentName = assignmentTitle.textContent.trim();
  }

  // Find the table - be more specific with the selector
  const table = document.querySelector('table.generaltable');
  console.log('Found table:', table);
  if (!table) {
    console.error('Could not find the grading table');
    return data;
  }

  // Get column indices from table headers
  const columnMap = {};
  const headers = table.querySelectorAll('thead th');
  console.log('Found headers:', headers);

  headers.forEach((header, index) => {
    const headerText = header.textContent.trim();
    console.log('Header text:', headerText, 'at index:', index);

    // Map column indices based on header text
    if (headerText.includes('name')) {
      columnMap.name = index;
    }
    if (headerText.includes('Email')) {
      columnMap.email = index;
    }
    if (headerText.includes('Status')) {
      columnMap.status = index;
    }
    if (headerText === 'Grade') {
      columnMap.grade = index;
    }
    if (headerText.includes('Last modified')) {
      columnMap.lastModified = index;
    }
    if (headerText.includes('Feedback')) {
      columnMap.feedback = index;
    }
    if (headerText.includes('ID')) {
      columnMap.idNumber = index;
    }
  });

  console.log('Column mapping:', columnMap);

  // Get all student rows
  const rows = table.querySelectorAll('tbody tr');
  console.log('Found rows:', rows.length);

  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td');
    console.log(`Processing row ${rowIndex}, found cells:`, cells.length);

    if (cells.length > 0) {
      // Get the name from the "First name / Last name" column
      let fullName = '';
      const nameCell = cells[columnMap.name];
      if (nameCell) {
        // Try to get the text content, excluding any hidden elements
        const visibleText = Array.from(nameCell.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE || 
                         (node.nodeType === Node.ELEMENT_NODE && 
                          !node.classList.contains('accesshide')))
          .map(node => node.textContent.trim())
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        fullName = visibleText;
      }

      const studentData = {
        name: fullName,
        email: cells[columnMap.email]?.textContent.trim() || '',
        idNumber: cells[columnMap.idNumber]?.textContent.trim() || '',
        status: cells[columnMap.status]?.textContent.trim() || '',
        grade: cells[columnMap.grade]?.textContent.trim() || '',
        lastModifiedSubmission: cells[columnMap.lastModified]?.textContent.trim() || '',
        feedback: cells[columnMap.feedback]?.textContent.trim() || '',
        appliedIds: []
      };

      // Clean up the data
      if (studentData.grade === '-') studentData.grade = '';
      if (studentData.feedback === '-') studentData.feedback = '';

      console.log('Extracted student data:', studentData);

      // Only add if we have a valid name
      if (studentData.name && studentData.name !== 'Select') {
        data.students.push(studentData);
      }
    }
  });

  console.log('Final collected data:', data);
  return data;
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
    
    if (!data.students.length) {
      console.error('No student data was collected');
      alert('Unable to collect student data. Please check if you are on the correct page.');
      return;
    }

    const storageData = {
      assignmentName: data.assignmentName,
      students: data.students.map(student => ({
        name: student.name,
        email: student.email,
        status: student.status,
        grade: student.grade || '',
        lastModifiedSubmission: student.lastModifiedSubmission || '',
        feedback: student.feedback || '',
        appliedIds: []
      })),
      timestamp: new Date().toISOString()
    };

    // Store data in chrome.storage.local
    chrome.storage.local.set({ moodleGradingData: storageData }, () => {
      // Open in a new tab after data is stored
      window.open(chrome.runtime.getURL('build/index.html'), '_blank');
    });

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
    const button = createGradingButton();
    // Add some margin to separate from the dropdown
    button.style.marginLeft = '10px';
    button.style.display = 'inline-block';
    // Insert the button after the dropdown
    dropdown.insertAdjacentElement('afterend', button);
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