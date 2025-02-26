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

          // Get assignment name
          const assignmentTitle = document.querySelector('.page-header-headings h1');
          if (assignmentTitle) {
            data.assignmentName = encodeURIComponent(assignmentTitle.textContent.trim());
          }

          // Get student submissions
          const submissionRows = document.querySelectorAll('table.generaltable tbody tr');
          submissionRows.forEach(row => {
            const nameCell = row.querySelector('td.cell.c1');
            const submissionCell = row.querySelector('td.cell.c3');
            const gradeCell = row.querySelector('td.cell.c4');
            
            if (nameCell && submissionCell) {
              const studentData = {
                name: encodeURIComponent(nameCell.textContent.trim()),
                submission: encodeURIComponent(submissionCell.textContent.trim()),
                grade: gradeCell ? encodeURIComponent(gradeCell.textContent.trim()) : ''
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
      console.log('Error adding Moodle Grading button:', error);
    }
  });