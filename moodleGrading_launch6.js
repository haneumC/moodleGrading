document.addEventListener('DOMContentLoaded', function() {
    // Look for the grading action section using valid selectors
    const gradingActionLabel = Array.from(document.getElementsByTagName('label'))
      .find(label => label.textContent.includes('Grading action'));
    
    // Also look for the Choose dropdown
    const chooseDropdown = document.querySelector('select[name="action"]') ||
                          document.querySelector('.custom-select');
  
    const targetElement = gradingActionLabel || chooseDropdown;
    
    if (targetElement) {
      const newBtn = document.createElement('button');
      newBtn.innerHTML = "Open Moodle Grading";
      newBtn.className = 'btn btn-primary';
      newBtn.style = `
        margin-left: 0.5rem;
        background-color: #0f6cbf;
        border: none;
        padding: 7px 12px;
        border-radius: 4px;
        color: white;
        cursor: pointer;
        vertical-align: middle;
      `;
      
      newBtn.onclick = function() {
        window.open('https://haneumc.github.io/moodleGrading/', '_blank');
      };
  
      // If we found the label, insert after its associated dropdown
      if (gradingActionLabel && gradingActionLabel.nextElementSibling) {
        gradingActionLabel.nextElementSibling.parentNode.insertBefore(newBtn, gradingActionLabel.nextElementSibling.nextSibling);
      } else {
        // Otherwise insert after whatever we found
        targetElement.parentNode.insertBefore(newBtn, targetElement.nextSibling);
      }
    }
  });