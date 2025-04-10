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

// Function to add the button to the page
function addGradingButton() {
  // Check if button already exists
  if (document.querySelector('.moodle-grading-btn')) {
    return;
  }

  // Create the button
  const btn = document.createElement('button');
  btn.textContent = 'Open Moodle Grading';
  btn.className = 'btn btn-primary moodle-grading-btn';
  btn.style.cssText = `
    margin-left: 10px;
    background-color: #0f6cbf;
    border: none;
    padding: 7px 12px;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    display: inline-block;
  `;

  // Add click handler
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = collectGradingData();
      if (!data.studentData.length) {
        alert('No student data found.');
        return;
      }
      // Only encode the data when creating the URL
      const encodedData = encodeURIComponent(JSON.stringify(data));
      window.open(`https://haneumc.github.io/moodleGrading/?data=${encodedData}`, '_blank');
    } catch (error) {
      console.error('Error:', error);
      alert('Error collecting data. Please check the console for details.');
    }
  });

  // Find the grading action dropdown
  const gradingDropdown = document.querySelector('select[name="jump"]');
  if (gradingDropdown) {
    // Insert the button right after the dropdown
    gradingDropdown.insertAdjacentElement('afterend', btn);
    return;
  }

  // Fallback - add to the top of the grading table
  const gradingTable = document.querySelector('.generaltable');
  if (gradingTable) {
    gradingTable.parentElement.insertBefore(btn, gradingTable);
  }
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

// Listen for messages from the React app
window.addEventListener('message', function(event) {
  console.log('Message received:', event.data);
  // Accept messages from the React app
  if (event.data.type === 'WRITE_GRADES') {
    console.log('Received grades to write:', event.data);
    writeGradesToMoodle(event.data.data.students);
  }
});

function writeGradesToMoodle(students) {
  console.log('Writing grades for students:', students);
  const table = document.querySelector('table.generaltable');
  if (!table) {
    console.error('Could not find grading table');
    return;
  }

  let updatedCount = 0;
  const rows = table.querySelectorAll('tbody tr');
  
  rows.forEach((row, index) => {
    // Find the email cell (it's usually the cell containing @bobeldyk.us or @calvin.edu)
    let studentEmail = '';
    const cells = Array.from(row.querySelectorAll('td'));
    
    cells.some(cell => {
      const text = cell.textContent.trim();
      if (text.includes('@bobeldyk.us') || text.includes('@calvin.edu')) {
        studentEmail = text;
        return true;
      }
      return false;
    });

    console.log(`Row ${index + 1}: Processing for email:`, studentEmail);
    
    if (!studentEmail) {
      console.log(`Row ${index + 1}: No email found`);
      return;
    }

    const student = students.find(s => s.email === studentEmail);
    if (!student) {
      console.log(`Row ${index + 1}: No matching student data for email:`, studentEmail);
      return;
    }

    console.log(`Row ${index + 1}: Found matching student:`, student);

    try {
      // Find and update grade - look for input near the "Grade" button or with specific pattern
      const gradeInput = row.querySelector('input[id*="grade_"]') || 
                        cells.find(cell => cell.querySelector('button.btn-primary'))?.querySelector('input[type="text"]');

      if (gradeInput && student.grade) {
        console.log(`Row ${index + 1}: Setting grade for ${studentEmail} to ${student.grade}`);
        gradeInput.value = student.grade;
        gradeInput.dispatchEvent(new Event('change', { bubbles: true }));
        gradeInput.dispatchEvent(new Event('input', { bubbles: true }));
        // Also try to update any associated span/div that might show the grade
        const gradeDisplay = gradeInput.parentElement.querySelector('span, div');
        if (gradeDisplay) {
          gradeDisplay.textContent = student.grade;
        }
        updatedCount++;
      } else {
        console.log(`Row ${index + 1}: No grade input found or no grade to set`);
      }

      // Find and update feedback
      const feedbackCell = cells.find(cell => cell.querySelector('textarea'));
      const feedbackTextarea = feedbackCell?.querySelector('textarea');
      
      if (feedbackTextarea && student.feedback) {
        console.log(`Row ${index + 1}: Setting feedback for ${studentEmail}`);
        feedbackTextarea.value = student.feedback;
        feedbackTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        feedbackTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        updatedCount++;
      } else {
        console.log(`Row ${index + 1}: No feedback textarea found or no feedback to set`);
      }
    } catch (error) {
      console.error(`Row ${index + 1}: Error updating grade/feedback:`, error);
    }
  });

  console.log('Updated', updatedCount, 'fields');

  if (updatedCount > 0) {
    // Find the "Save all quick grading changes" button
    const saveButton = document.querySelector('input[value="Save all quick grading changes"]');
    if (saveButton) {
      saveButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alert(`Updated ${updatedCount} fields. Please review and click "Save all quick grading changes" to submit.`);
    } else {
      console.error('Save button not found');
      alert(`Updated ${updatedCount} fields but could not find the save button. Please save changes manually using the "Save all quick grading changes" button.`);
    }
  } else {
    console.warn('No fields were updated');
    alert('No matching students found to update. Please check if the emails match exactly.');
  }
}

// Initialize only once
const init = (function() {
  let initialized = false;
  
  return function() {
    if (initialized) {
      console.log('Already initialized');
      return;
    }
    
    console.log('Initializing Moodle Grading Assistant...');
    if (!isGradingPage()) {
      console.log('Not a grading page, skipping initialization');
      return;
    }

    console.log('Found grading page, adding button...');
    addGradingButton();
    initialized = true;
  };
})();

// Call init once when the script loads
init();

// Watch for page changes but avoid multiple initializations
const observer = new MutationObserver((mutations) => {
  if (!document.querySelector('.moodle-grading-btn')) {
    init();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Function to apply grades and feedback to Moodle
function applyGradesToMoodle(data) {
  try {
    const rows = document.querySelectorAll('table.generaltable > tbody > tr');
    let appliedCount = 0;
    
    data.students.forEach(student => {
      rows.forEach(row => {
        // Find matching student by email
        const cells = row.querySelectorAll('td');
        let foundEmail = false;
        
        for (const cell of cells) {
          const text = cell.textContent.trim();
          if ((text.includes('@bobeldyk.us') || text.includes('@calvin.edu')) && text === student.email) {
            foundEmail = true;
            break;
          }
        }
        
        if (foundEmail) {
          // Apply grade if exists
          const gradeInput = row.querySelector('input[id*="quickgrade"]');
          if (gradeInput && student.grade) {
            gradeInput.value = student.grade;
            appliedCount++;
          }
          
          // Apply feedback if exists
          const feedbackArea = row.querySelector('textarea[id*="quickgrade"]');
          if (feedbackArea && student.feedback) {
            feedbackArea.value = student.feedback;
            appliedCount++;
          }
        }
      });
    });
    
    // Submit the form if grades were applied
    if (appliedCount > 0) {
      const submitButton = document.querySelector('input[name="savechanges"]');
      if (submitButton) {
        submitButton.click();
      }
    }
    
    return appliedCount;
  } catch (error) {
    console.error('Error applying grades:', error);
    throw error;
  }
}

// Add event listener for the custom event
window.addEventListener('write-to-moodle', (event) => {
  const { students } = event.detail;
  writeGradesToMoodle(students);
}); 