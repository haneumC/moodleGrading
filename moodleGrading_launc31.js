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

          // Get table headers first to map column indices
          const headerRow = document.querySelector('table.generaltable > thead > tr');
          const headerCells = headerRow ? headerRow.getElementsByTagName('th') : [];
          const columnMap = {};
          Array.from(headerCells).forEach((cell, index) => {
            columnMap[cell.textContent.trim()] = index;
          });

          // Get student submissions from the table
          const rows = document.querySelectorAll('table.generaltable > tbody > tr');

          rows.forEach((row, index) => {
            const cells = row.getElementsByTagName('td');

            if (cells.length > 0) {
              // Get all fields from the row
              const studentData = {
                identifier: cells[columnMap['Identifier']]?.textContent.trim() || '',
                name: cells[columnMap['Full name']]?.textContent.replace('Select', '').trim() || '',
                idNumber: cells[columnMap['ID number']]?.textContent.trim() || '',
                email: cells[columnMap['Email address']]?.textContent.trim() || '',
                status: cells[columnMap['Status']]?.textContent.trim() || '',
                grade: cells[columnMap['Grade']]?.textContent.trim() || '',
                maxGrade: cells[columnMap['Maximum Grade']]?.textContent.trim() || '',
                gradeCanBeChanged: cells[columnMap['Grade can be changed']]?.textContent.trim() || '',
                lastModifiedSubmission: cells[columnMap['Last modified (submission)']]?.textContent.trim() || '',
                onlineText: cells[columnMap['Online text']]?.textContent.trim() || '',
                lastModifiedGrade: cells[columnMap['Last modified (grade)']]?.textContent.trim() || '',
                feedback: cells[columnMap['Feedback comments']]?.textContent.trim() || ''
              };

              // Clean up specific fields
              if (studentData.grade === '-') studentData.grade = '';
              if (studentData.feedback === '-') studentData.feedback = '';

              // Encode all fields
              const encodedData = {};
              Object.entries(studentData).forEach(([key, value]) => {
                encodedData[key] = encodeURIComponent(value);
              });

              // Add appliedIds for the UI
              encodedData.appliedIds = [];

              if (studentData.name) {
                data.studentData.push(encodedData);
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