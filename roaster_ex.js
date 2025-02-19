window.addEventListener('load', () => {
  const learningModeBtn = document.getElementById('report-roster-toggle');
  
  const newBtn = document.createElement('button');
  newBtn.innerHTML = "Open Moodle Grading";
  newBtn.style = 'margin-left: 1rem';
  
  newBtn.onclick = function() {
    // Replace with your deployed application URL
    window.open('https://haneumc.github.io/moodleGrading/', '_blank');
  };

  learningModeBtn.parentNode.insertBefore(newBtn, learningModeBtn.nextSibling);
});