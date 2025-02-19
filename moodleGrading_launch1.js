window.addEventListener('load', () => {
  // Look for the grading action label using text content
  const labels = Array.from(document.getElementsByTagName('label'));
  const gradingActionLabel = labels.find(label => label.textContent.includes('Grading action'));
  
  // Or try to find the select element directly
  const selectElement = document.querySelector('.custom-select[data-init-value]');
  
  if (selectElement || gradingActionLabel) {
    const newBtn = document.createElement('button');
    newBtn.innerHTML = "Open Moodle Grading";
    // Match Moodle's styling
    newBtn.className = 'btn btn-secondary custom-select';
    newBtn.style = 'margin-left: 0.5rem; height: 36px; vertical-align: top;';
    
    newBtn.onclick = function() {
      window.open('https://haneumc.github.io/moodleGrading/', '_blank');
    };

    // Insert the button after the select element
    const targetElement = selectElement || gradingActionLabel.nextElementSibling;
    targetElement.parentNode.insertBefore(newBtn, targetElement.nextSibling);
  }
});