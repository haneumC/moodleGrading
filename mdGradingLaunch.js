// Wrap everything in a timeout to let Moodle initialize first
setTimeout(function() {
  // Only run on assignment pages
  if (!window.location.href.includes('/mod/assign/view.php')) {
    return;
  }

  function collectGradingData() {
    const data = {
      assignmentName: '',
      studentData: []
    };

    // Get assignment name
    const assignmentTitle = document.querySelector('.page-header-headings h1');
    if (assignmentTitle) {
      data.assignmentName = encodeURIComponent(assignmentTitle.textContent.trim());
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
            name: encodeURIComponent(nameText),
            email: encodeURIComponent(emailText),
            grade: encodeURIComponent(gradeText),
            feedback: encodeURIComponent(feedbackText),
            appliedIds: []
          });
        }
      } catch (err) {
        console.error('Error processing row:', err);
      }
    });

    return data;
  }

  // Create the button
  const btn = document.createElement('button');
  btn.textContent = 'Open Moodle Grading';
  btn.className = 'btn btn-primary';
  btn.style.cssText = `
    margin: 10px;
    background-color: #0f6cbf;
    border: none;
    padding: 7px 12px;
    border-radius: 4px;
    color: white;
    cursor: pointer;
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
      const encodedData = encodeURIComponent(JSON.stringify(data));
      window.open(`https://haneumc.github.io/moodleGrading/?data=${encodedData}`, '_blank');
    } catch (error) {
      console.error('Error:', error);
      alert('Error collecting data. Please check the console for details.');
    }
  });

  // Try to find a good place to insert the button
  const possibleTargets = [
    '.gradingform_rubric',
    '.gradingbatch',
    '.path-mod-assign',
    '#page-content',
    '#region-main',
    '.gradingtable'
  ];

  let inserted = false;
  for (const selector of possibleTargets) {
    const target = document.querySelector(selector);
    if (target) {
      target.insertAdjacentElement('beforebegin', btn);
      inserted = true;
      break;
    }
  }

  // Fallback - insert at top of body if no other location found
  if (!inserted) {
    document.body.insertAdjacentElement('afterbegin', btn);
  }

}, 2000); // Wait 2 seconds before running our code