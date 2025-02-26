document.addEventListener('DOMContentLoaded', function() {
    try {
      // Look for the grading action section using valid selectors
      const gradingActionLabel = Array.from(document.getElementsByTagName('label'))
        .find(label => label.textContent.includes('Grading action'));
      
      const chooseDropdown = document.querySelector('select[name="action"]') ||
                            document.querySelector('.custom-select');
  
      const targetElement = gradingActionLabel || chooseDropdown;
      
      if (targetElement) {
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
            // Get student name from First name / Last name columns
            const firstNameCell = row.querySelector('td.cell.c1');
            const lastNameCell = row.querySelector('td.cell.c2');
            const fullName = firstNameCell && lastNameCell ? 
              `${firstNameCell.textContent.trim()} ${lastNameCell.textContent.trim()}` : '';

            // Get email from ID number column
            const emailCell = row.querySelector('td.cell.c3');
            
            // Get status from Status column
            const statusCell = row.querySelector('td.cell.c5 div');
            
            // Get feedback from Feedback comments column
            const feedbackCell = row.querySelector('td.cell.c12');
            
            // Get grade from Final grade column
            const gradeCell = row.querySelector('td.cell.c15');
            
            if (fullName) {
              const studentData = {
                name: encodeURIComponent(fullName),
                email: emailCell ? encodeURIComponent(emailCell.textContent.trim()) : '',
                timestamp: new Date().toISOString(),
                submission: statusCell ? encodeURIComponent(statusCell.textContent.trim()) : 'No submission',
                grade: gradeCell ? encodeURIComponent(gradeCell.textContent.trim()) : '-',
                feedback: feedbackCell ? encodeURIComponent(feedbackCell.textContent.trim()) : '',
                appliedIds: []
              };
              console.log('Processing student:', studentData); // Debug individual student data
              data.studentData.push(studentData);
            }
          });

          console.log('Raw table rows:', document.querySelectorAll('table.generaltable tbody tr').length);
          console.log('Student data collected:', data.studentData.length);
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
      console.error('Error adding Moodle Grading button:', error);
      console.error('Error details:', error.message);
    }
  });