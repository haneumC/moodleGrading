document.addEventListener('DOMContentLoaded', function() {
    try {
      // Look for the grading action section using valid selectors
      const gradingActionLabel = Array.from(document.getElementsByTagName('label'))
        .find(label => label.textContent.includes('Grading action'));
      
      const chooseDropdown = document.querySelector('select[name="action"]') ||
                            document.querySelector('.custom-select');
  
      const targetElement = gradingActionLabel || chooseDropdown;
      
      if (targetElement) {
        const newBtn = document.createElement('a');
        newBtn.innerHTML = "Open Moodle Grading";
        newBtn.className = 'btn btn-primary';
        
        // Add click event listener to collect and pass data
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Collect data from the table
            const students = [];
            const rows = document.querySelectorAll('.generaltable tbody tr');
            
            console.log('Found rows:', rows.length); // Debug log

            rows.forEach(row => {
                const nameCell = row.querySelector('td:nth-child(3)');
                const emailCell = row.querySelector('td:nth-child(4)');
                const statusCell = row.querySelector('td:nth-child(5)');
                const gradeCell = row.querySelector('td:nth-child(6)');
                
                console.log('Row cells:', { // Debug log
                    name: nameCell?.textContent,
                    email: emailCell?.textContent,
                    status: statusCell?.textContent,
                    grade: gradeCell?.textContent
                });

                if (nameCell && emailCell) {
                    const studentData = {
                        name: nameCell.textContent?.trim() || '',
                        email: emailCell.textContent?.trim() || '',
                        status: statusCell?.textContent?.trim() || '',
                        grade: gradeCell?.textContent?.trim() || ''
                    };
                    students.push(studentData);
                }
            });

            console.log('Collected students:', students); // Debug log

            // Store data in localStorage
            localStorage.setItem('moodleStudentData', JSON.stringify(students));
            console.log('Stored in localStorage:', localStorage.getItem('moodleStudentData')); // Debug log

            // Open the webapp in a new tab
            window.open('https://haneumc.github.io/moodleGrading/', '_blank', 'noopener');
        });

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