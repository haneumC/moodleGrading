// Function to check if we're on a grading page
function isGradingPage() {
  console.log('Checking if on grading page...');
  const isGrading = window.location.href.includes('action=grading') && 
         document.querySelector('.generaltable') !== null;
  console.log('Is grading page:', isGrading);
  return isGrading;
}

// Function to collect grading data from the page
function collectGradingData() {
  console.log('Starting to collect grading data...');
  const data = {
    assignmentName: '',
    studentData: []
  };

  // Get assignment name
  const assignmentTitle = document.querySelector('.page-header-headings h1');
  console.log('Found assignment title element:', !!assignmentTitle);
  if (assignmentTitle) {
    data.assignmentName = assignmentTitle.textContent.trim();
    console.log('Assignment name:', data.assignmentName);
  }

  // Get all student rows
  const rows = document.querySelectorAll('table.generaltable > tbody > tr');
  console.log('Found student rows:', rows.length);
  
  rows.forEach((row, index) => {
    try {
      console.log(`Processing row ${index + 1}...`);
      // Get name from first cell
      const nameCell = row.querySelector('td');
      if (!nameCell) {
        console.log('No name cell found in row');
        return;
      }
      
      const nameText = nameCell.textContent.trim().replace('Select', '').trim();
      if (!nameText) {
        console.log('No name text found after processing');
        return;
      }
      console.log('Found student name:', nameText);

      // Get email
      let emailText = '';
      const cells = row.querySelectorAll('td');
      console.log('Processing cells for email...');
      for (const cell of cells) {
        const text = cell.textContent.trim();
        if (text.includes('@bobeldyk.us') || text.includes('@calvin.edu')) {
          emailText = text;
          console.log('Found student email:', emailText);
          break;
        }
      }

      // Get grade and feedback
      let gradeText = '';
      let feedbackText = '';

      // Look for grade input
      const gradeInput = row.querySelector('input[id*="quickgrade"]');
      console.log('Found grade input:', !!gradeInput);
      if (gradeInput) {
        gradeText = gradeInput.value || '';
        console.log('Grade value:', gradeText);
      }

      // Look for feedback textarea
      const feedbackArea = row.querySelector('textarea[id*="quickgrade"]');
      console.log('Found feedback area:', !!feedbackArea);
      if (feedbackArea) {
        feedbackText = feedbackArea.value || '';
        console.log('Feedback text length:', feedbackText.length);
      }

      // Add to data if we have at least a name
      if (nameText) {
        const studentData = {
          name: nameText,
          email: emailText,
          grade: gradeText,
          feedback: feedbackText,
          appliedIds: []
        };
        console.log('Adding student data:', studentData);
        data.studentData.push(studentData);
      }
    } catch (err) {
      console.error('Error processing row:', err);
    }
  });

  console.log('Final collected data:', data);
  return data;
}

// Function to write grades back to Moodle
function writeGradesToMoodle(students) {
  console.log('Starting to write grades to Moodle...');
  console.log('Students to process:', students);
  
  try {
    let appliedCount = 0;
    
    // Process each student
    students.forEach(student => {
      console.log('Processing student:', student);
      
      // Find the row for this student
      const rows = document.querySelectorAll('table.generaltable > tbody > tr');
      rows.forEach(row => {
        let foundEmail = false;
        
        // Check each cell for the email
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
          if (cell.textContent.trim() === student.email) {
            console.log('Found matching row for email:', student.email);
            foundEmail = true;
          }
        });
        
        if (foundEmail) {
          // Apply grade if exists
          const gradeInput = row.querySelector('input[id*="quickgrade"]');
          if (gradeInput && student.grade) {
            console.log('Applying grade:', student.grade);
            gradeInput.value = student.grade;
            appliedCount++;
          }
          
          // Apply feedback if exists
          const feedbackArea = row.querySelector('textarea[id*="quickgrade"]');
          if (feedbackArea && student.feedback) {
            console.log('Applying feedback of length:', student.feedback.length);
            feedbackArea.value = student.feedback;
            appliedCount++;
          }
        }
      });
    });
    
    // Submit the form if grades were applied
    if (appliedCount > 0) {
      console.log('Changes made, submitting form...');
      const submitButton = document.querySelector('input[name="savechanges"]');
      if (submitButton) {
        submitButton.click();
      }
    } else {
      console.log('No changes to submit');
    }
    
    return appliedCount;
  } catch (error) {
    console.error('Error applying grades:', error);
    throw error;
  }
}

// Function to launch the grading assistant
function launchGradingAssistant() {
  try {
    console.log('Starting grading assistant launch...');
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

    console.log('Prepared storage data:', storageData);
    // Use URL parameters instead of Chrome storage
    const encodedData = encodeURIComponent(JSON.stringify(storageData));
    const url = `${chrome.runtime.getURL('build/index.html')}?data=${encodedData}`;
    console.log('Opening URL:', url);
    window.open(url, '_blank');

  } catch (error) {
    console.error('Error launching grading assistant:', error);
    alert('An error occurred while collecting data. Please check the console for details.');
  }
}

// Function to add the grading button
function addGradingButton() {
  const container = document.querySelector('.page-header-headings');
  console.log('Found header container:', !!container);
  if (container && !document.getElementById('grading-assistant-btn')) {
    const button = document.createElement('button');
    button.id = 'grading-assistant-btn';
    button.textContent = 'Grade with Grading Assistant';
    button.className = 'btn btn-primary ml-2';
    button.style.marginLeft = '10px';
    button.onclick = launchGradingAssistant;
    container.appendChild(button);
    console.log('Grading button added');
  }
}

// Initialize
console.log('Initializing Grading Assistant extension...');
addGradingButton();

// Listen for messages
window.addEventListener('message', (event) => {
  console.log('Message received:', event.data);
  if (event.data.type === 'WRITE_GRADES') {
    console.log('Received grades to write:', event.data.data);
    writeGradesToMoodle(event.data.data.students);
  }
}); 