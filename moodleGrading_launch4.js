document.addEventListener('DOMContentLoaded', function() {
  // Try to find a suitable location for the button
  const possibleTargets = [
    document.getElementById('report-roster-toggle'),
    document.querySelector('.gradingaction'),
    document.querySelector('label[for="id_action"]'),
    document.querySelector('.custom-select')
  ];

  // Find the first available target
  const targetElement = possibleTargets.find(element => element !== null);

  if (targetElement) {
    const newBtn = document.createElement('button');
    newBtn.innerHTML = "Open Moodle Grading";
    newBtn.className = 'btn btn-primary';
    newBtn.style = 'margin-left: 1rem; background-color: #0f6cbf;';
    
    newBtn.onclick = function() {
      window.open('https://haneumc.github.io/moodleGrading/', '_blank');
    };

    targetElement.parentNode.insertBefore(newBtn, targetElement.nextSibling);
  }
});