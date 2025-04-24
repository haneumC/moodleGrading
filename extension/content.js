// Function to extract max grade from the Moodle page
function getMaxGrade() {
  const firstGradeCell = document.querySelector('input[name^="quickgrade"]');
  if (firstGradeCell) {
    const gradeText = firstGradeCell.closest('td')?.textContent || '';
    const maxGradeMatch = gradeText.match(/\/\s*(\d+(?:\.\d+)?)/);
    if (maxGradeMatch) {
      return maxGradeMatch[1];
    }
  }
  return '100.00'; // Default to 100 if not found
}

// Function to extract student data from the Moodle page
function extractStudentData() {
  const rows = document.querySelectorAll('table#user-grades tr.user');
  const maxGrade = getMaxGrade();
  const students = [];

  rows.forEach(row => {
    const nameCell = row.querySelector('th.cell.c0');
    const gradeCell = row.querySelector('input[name^="quickgrade"]');
    const emailCell = row.querySelector('td.cell.c1');
    const feedbackCell = row.querySelector('textarea[name^="feedback"]');

    if (nameCell && gradeCell) {
      const name = nameCell.textContent.trim();
      const email = emailCell ? emailCell.textContent.trim() : '';
      const grade = gradeCell.value || '';
      const feedback = feedbackCell ? feedbackCell.value : '';

      students.push({
        name,
        email,
        grade,
        feedback,
        maxGrade,
        appliedIds: [],
        status: 'Not Started'
      });
    }
  });

  return {
    assignmentName: document.querySelector('.page-header-headings h1')?.textContent || 'Assignment 1',
    students,
    maxGrade
  };
}

// Function to open the grading assistant
function openGradingAssistant() {
  const data = extractStudentData();
  
  // Store the data in Chrome storage
  chrome.storage.local.set({
    moodleGradingData: {
      ...data,
      timestamp: new Date().toISOString()
    }
  }, () => {
    // Open the grading assistant in a new window
    const gradingUrl = chrome.runtime.getURL('index.html');
    window.open(gradingUrl, '_blank');
  });
}

// Add the grading button
function addGradingButton() {
  const container = document.querySelector('.page-header-headings');
  if (container && !document.getElementById('grading-assistant-btn')) {
    const button = document.createElement('button');
    button.id = 'grading-assistant-btn';
    button.textContent = 'Grade with Grading Assistant';
    button.className = 'btn btn-primary ml-2';
    button.style.marginLeft = '10px';
    button.onclick = openGradingAssistant;
    container.appendChild(button);
  }
}

// Initialize
addGradingButton();

// Listen for messages from the grading assistant
window.addEventListener('message', (event) => {
  if (event.data.type === 'WRITE_GRADES') {
    const { students } = event.data.data;
    
    // Write grades and feedback back to Moodle
    students.forEach(student => {
      const row = Array.from(document.querySelectorAll('table#user-grades tr.user'))
        .find(row => row.querySelector('td.cell.c1')?.textContent.trim() === student.email);
      
      if (row) {
        const gradeInput = row.querySelector('input[name^="quickgrade"]');
        const feedbackInput = row.querySelector('textarea[name^="feedback"]');
        
        if (gradeInput && student.grade) {
          gradeInput.value = student.grade;
          gradeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (feedbackInput && student.feedback) {
          feedbackInput.value = student.feedback;
          feedbackInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  }
}); 