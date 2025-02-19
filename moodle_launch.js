window.addEventListener('load', () => {
  // Find the reference button (same as in original example)
  const learningModeBtn = document.getElementById('report-roster-toggle');
  
  // Create new button
  const newBtn = document.createElement('button');
  newBtn.innerHTML = "Open Moodle Grading";
  newBtn.style = 'margin-left: 1rem';
  
  // Add click handler to open the webpage
  newBtn.onclick = function() {
    window.open('YOUR_MOODLE_GRADING_URL', '_blank');
    // '_blank' opens in new tab. Use '_self' to open in same window
  };

  // Insert button after the reference button
  learningModeBtn.parentNode.insertBefore(newBtn, learningModeBtn.nextSibling);
});