document.addEventListener('DOMContentLoaded', function() {
  try {
    // Look for the grading action section using valid selectors
    const gradingActionLabel = Array.from(document.getElementsByTagName('label'))
      .find(label => label.textContent.includes('Grading action'));
    
    const chooseDropdown = document.querySelector('select[name="action"]') ||
                          document.querySelector('.custom-select');

    const targetElement = gradingActionLabel || chooseDropdown;
    
    if (targetElement) {
      const newBtn = document.createElement('a'); // Using anchor instead of button
      newBtn.innerHTML = "Open Moodle Grading";
      newBtn.className = 'btn btn-primary';
      newBtn.href = 'https://haneumc.github.io/moodleGrading/';
      newBtn.target = '_blank';
      newBtn.rel = 'noopener'; // Security best practice for external links
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