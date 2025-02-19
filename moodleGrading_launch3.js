// Wait for both DOM and jQuery to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Try different approaches to find the target location
  function addButton() {
    // First try the original approach
    const selectElement = document.querySelector('.custom-select[data-init-value]');
    const gradingAction = document.querySelector('label[for="id_action"]');
    const learningModeBtn = document.getElementById('report-roster-toggle');
    
    // Find the best target element
    const targetElement = selectElement || gradingAction || learningModeBtn;
    
    if (targetElement) {
      const newBtn = document.createElement('button');
      newBtn.innerHTML = "Open Moodle Grading";
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

      targetElement.parentNode.insertBefore(newBtn, targetElement.nextSibling);
    }
  }

  // Try to add the button, and retry after a short delay if needed
  addButton();
  setTimeout(addButton, 1000); // Retry after 1 second if first attempt fails
});