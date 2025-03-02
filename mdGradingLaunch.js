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
          const rows = document.querySelectorAll('table.generaltable > tbody > tr');

          rows.forEach((row, index) => {
            const cells = row.getElementsByTagName('td');

            if (cells.length > 0) {
              // Get the full name
              const rawNameText = cells[0] ? cells[0].textContent.trim() : '';
              const nameText = rawNameText.replace('Select', '').trim();
              
              // Get email by searching for a cell containing an email address
              const emailCell = Array.from(cells).find(cell => {
                const text = cell.textContent.trim();
                return text.includes('@bobeldyk.us') || text.includes('@calvin.edu');
              });
              const emailText = emailCell ? emailCell.textContent.trim() : '';
              
              // Get feedback from Feedback comments column and clean it
              const rawFeedback = cells[11] ? cells[11].textContent.replace(/\s+/g, ' ').trim() : '';
              const feedbackText = rawFeedback === '-' ? '' : rawFeedback;
              
              // Get grade from Final grade column and clean it
              const rawGrade = cells[14] ? cells[14].textContent.replace(/\s+/g, ' ').trim() : '';
              const gradeText = rawGrade === '-' ? '' : rawGrade;

              if (nameText) {
                const studentData = {
                  name: encodeURIComponent(nameText),
                  email: encodeURIComponent(emailText),
                  grade: encodeURIComponent(gradeText || ''),
                  feedback: encodeURIComponent(feedbackText || ''),
                  appliedIds: []
                };
                // Debug log to verify data
                console.log('Student data before push:', {
                  name: nameText,
                  email: emailText,
                  grade: gradeText || '',
                  feedback: feedbackText || ''
                });
                data.studentData.push(studentData);
              }
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
          try {
            const gradingData = collectGradingData();
            if (gradingData.studentData.length === 0) {
              console.error('No student data collected');
              alert('No student data found. Please check the console for details.');
              return;
            }
            const dataString = JSON.stringify(gradingData);
            // Debug log to see final encoded data
            console.log('Final data string:', dataString);
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