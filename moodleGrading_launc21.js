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

          // Debug: Log table presence
          const table = document.querySelector('table.generaltable');
          console.log('Found table:', !!table);

          // Get student submissions from the table
          const rows = document.querySelectorAll('table.generaltable > tbody > tr');
          console.log('Found rows:', rows.length);

          rows.forEach((row, index) => {
            // Get all cells in this row
            const cells = row.getElementsByTagName('td');
            console.log(`Row ${index} has ${cells.length} cells`);

            if (cells.length > 0) {
              // Get the full name
              const rawNameText = cells[0] ? cells[0].textContent.trim() : '';
              const nameText = rawNameText.replace('Select', '').trim();
              
              // Get email from Email address column (index 3)
              const emailText = cells[3] ? cells[3].textContent.trim() : '';
              
              // Get feedback from Feedback comments column
              const feedbackText = cells[11] ? cells[11].textContent.trim() : '';
              
              // Get grade from Final grade column
              const gradeText = cells[14] ? cells[14].textContent.trim() : '-';

              console.log('Processing row:', {
                name: nameText,
                email: emailText,
                feedback: feedbackText,
                grade: gradeText
              });

              if (nameText) {
                const studentData = {
                  name: encodeURIComponent(nameText),
                  email: encodeURIComponent(emailText),
                  grade: encodeURIComponent(gradeText),
                  feedback: encodeURIComponent(feedbackText),
                  appliedIds: []
                };
                data.studentData.push(studentData);
              }
            }
          });

          console.log('Final data:', data);
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
          try {
            const gradingData = collectGradingData();
            if (gradingData.studentData.length === 0) {
              console.error('No student data collected');
              alert('No student data found. Please check the console for details.');
              return;
            }
            const dataString = JSON.stringify(gradingData);
            const encodedData = encodeURIComponent(dataString);
            const url = `https://haneumc.github.io/moodleGrading/?data=${encodedData}`;
            window.open(url, '_blank');
          } catch (error) {
            console.error('Error collecting data:', error);
            alert('Error collecting data. Please check the console for details.');
          }
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