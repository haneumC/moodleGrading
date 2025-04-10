import React, { useState, useEffect } from 'react';

function App() {
  const [students, setStudents] = useState([]);
  const [assignmentName, setAssignmentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedData = urlParams.get('data');
      
      if (!encodedData) {
        throw new Error('No data found in URL parameters');
      }

      const data = JSON.parse(decodeURIComponent(encodedData));
      setStudents(data.students || []);
      setAssignmentName(data.assignmentName || '');
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load grading data. Please try again.');
      setLoading(false);
    }
  }, []);

  // ... rest of the component code ...
}

export default App; 