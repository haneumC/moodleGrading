import { Student } from '@/components/StudentList/types';

interface MoodleStudent {
  name: string;
  submission: string;
  grade: string;
}

export function getImportedMoodleData(): Student[] | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    
    if (!encodedData) return null;

    const decodedData = decodeURIComponent(encodedData);
    const moodleData = JSON.parse(decodedData);

    // Convert Moodle data format to Student[] format
    return moodleData.studentData.map((student: MoodleStudent) => ({
      name: decodeURIComponent(student.name),
      email: '', // Default empty email
      submission: decodeURIComponent(student.submission),
      grade: decodeURIComponent(student.grade) || '',
      feedback: '',
      appliedIds: [], // Empty array as default
      status: 'Not Started' as const
    }));
  } catch (error) {
    console.error('Error parsing Moodle data:', error);
    return null;
  }
} 