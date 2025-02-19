window.addEventListener('load', () => {
  const labels = Array.from(document.getElementsByTagName('label'));
  const gradingActionLabel = labels.find(label => label.textContent.includes('Grading action'));
  
  const selectElement = document.querySelector('.custom-select[data-init-value]');
  
  if (selectElement || gradingActionLabel) {
    const newBtn = document.createElement('button');
    newBtn.innerHTML = "Open Moodle Grading";
    // Change styling to match Moodle's regular button style
    newBtn.className = 'btn btn-primary';
    newBtn.style = `
      margin-left: 0.5rem;
      height: 36px;
      vertical-align: top;
      background-color: #0f6cbf;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
    `;
    
    newBtn.onclick = function() {
      window.open('https://haneumc.github.io/moodleGrading/', '_blank');
    };

    // Insert the button after the select element
    const targetElement = selectElement || gradingActionLabel.nextElementSibling;
    targetElement.parentNode.insertBefore(newBtn, targetElement.nextSibling);
  }
});