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
            const rows = document.querySelectorAll('table tr:not(:first-child)');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 0) {
                    const studentData = {
                        name: cells[2]?.textContent?.trim() || '',
                        email: cells[3]?.textContent?.trim() || '',
                        status: cells[4]?.textContent?.trim() || '',
                        grade: cells[5]?.textContent?.trim() || ''
                    };
                    students.push(studentData);
                }
            });

            // Store data in localStorage
            localStorage.setItem('moodleStudentData', JSON.stringify(students));

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