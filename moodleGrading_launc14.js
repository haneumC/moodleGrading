document.addEventListener('DOMContentLoaded', function() {
    try {
      // Look for the grading action section using valid selectors
      const gradingActionLabel = Array.from(document.getElementsByTagName('label'))
        .find(label => label.textContent.includes('Grading action'));
      
      const chooseDropdown = document.querySelector('select[name="action"]') ||
                            document.querySelector('.custom-select');
  
      const targetElement = gradingActionLabel || chooseDropdown;
      
      if (targetElement) {
        // Collect grading data
        function collectGradingData() {
          const data = {
            assignmentName: '',
            studentData: []
          };

          // Get assignment name from the page header
          const assignmentTitle = document.querySelector('.page-header-headings h1');
          if (assignmentTitle) {
            data.assignmentName = encodeURIComponent(assignmentTitle.textContent.trim());
          }

          // Get student submissions from the table
          const submissionRows = document.querySelectorAll('table.generaltable tbody tr');
          submissionRows.forEach(row => {
            // Get student name (both first and last name are in the same cell)
            const nameCell = row.querySelector('td a[href*="user"]');
            // Get email from the email column
            const emailCell = row.querySelector('td.cell:nth-child(4)');
            // Get submission status
            const statusCell = row.querySelector('td.cell.c5');
            // Get feedback comments
            const feedbackCell = row.querySelector('td.cell.c12');
            // Get final grade
            const gradeCell = row.querySelector('td.cell.c15');
            
            if (nameCell) {
              const studentData = {
                name: encodeURIComponent(nameCell.textContent.trim()),
                email: emailCell ? encodeURIComponent(emailCell.textContent.trim()) : '',
                timestamp: new Date().toISOString(),
                submission: statusCell ? encodeURIComponent(statusCell.textContent.trim()) : 'No submission',
                grade: gradeCell ? encodeURIComponent(gradeCell.textContent.trim()) : '',
                feedback: feedbackCell ? encodeURIComponent(feedbackCell.textContent.trim()) : '',
                appliedIds: []
              };
              data.studentData.push(studentData);
            }
          });

          return data;
        }

        const newBtn = document.createElement('a');
        newBtn.innerHTML = "Open Moodle Grading";
        newBtn.className = 'btn btn-primary';
        newBtn.target = '_blank';
        newBtn.rel = 'noopener';
        newBtn.style.cssText = `
          margin-left: 0.5rem;
          background-color: #0f6cbf;
          border: none;
          padding: 7px 12px;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          vertical-align: middle;
          text-decoration: none;
          display: inline-block;
        `;

        // Add click event listener to collect and pass data
        newBtn.addEventListener('click', function(e) {
          e.preventDefault();
          const gradingData = collectGradingData();
          console.log('Collected data:', gradingData); // For debugging
          const dataString = JSON.stringify(gradingData);
          const encodedData = encodeURIComponent(dataString);
          const url = `https://haneumc.github.io/moodleGrading/?data=${encodedData}`;
          window.open(url, '_blank');
        });
  
        // Insert the button
        if (gradingActionLabel && gradingActionLabel.nextElementSibling) {
          gradingActionLabel.nextElementSibling.parentNode.insertBefore(newBtn, gradingActionLabel.nextElementSibling.nextSibling);
        } else if (targetElement) {
          targetElement.parentNode.insertBefore(newBtn, targetElement.nextSibling);
        }
      }
    } catch (error) {
      console.error('Error adding Moodle Grading button:', error);
    }
  });