import { Student } from '@/components/StudentList/types';

interface MoodleImportStudent {
  name?: string;
  email?: string;
  grade?: string;
  feedback?: string;
  appliedIds?: number[];
  idNumber?: string;
  status?: string;
  lastModifiedSubmission?: string;
  onlineText?: string;
  lastModifiedGrade?: string;
  gradeCanBeChanged?: string;
  maxGrade?: string;
}

interface MoodleImportData {
  students: Student[];
  assignmentName?: string;
  maxGrade: string;
}

export function getImportedMoodleData(): MoodleImportData | null {
  try {
    console.log('Starting getImportedMoodleData()...');
    console.log('Chrome storage API available:', !!window.chrome?.storage?.local);
    
    const sessionData = sessionStorage.getItem('moodleGradingData');
    console.log('Session storage data:', sessionData);
    
    if (!sessionData) {
      console.log('No data in sessionStorage, checking chrome.storage.local...');
      
      if (window.chrome?.storage?.local) {
        console.log('Attempting to read from chrome.storage.local...');
        window.chrome.storage.local.get(['moodleGradingData'], (result) => {
          console.log('Chrome storage data:', result);
          console.log('moodleGradingData present:', !!result.moodleGradingData);
          
          if (result.moodleGradingData) {
            console.log('Found data in chrome.storage, full data:', JSON.stringify(result.moodleGradingData, null, 2));
            sessionStorage.setItem('moodleGradingData', JSON.stringify(result.moodleGradingData));
            console.log('Data stored in sessionStorage, reloading page...');
            window.location.reload();
          } else {
            console.log('No data found in chrome.storage.local');
          }
        });
      } else {
        console.log('Chrome storage API not available');
      }
      return null;
    }

    console.log('Parsing session storage data...');
    const parsedData = JSON.parse(sessionData) as MoodleImportData;
    console.log('Parsed data:', JSON.stringify(parsedData, null, 2));
    
    if (!parsedData || !Array.isArray(parsedData.students)) {
      console.error('Invalid data format:', parsedData);
      return null;
    }

    const maxGrade = parsedData.maxGrade || '100.00';
    console.log('Using max grade:', maxGrade);

    console.log('Starting student data transformation...');
    const transformedStudents: Student[] = parsedData.students.map((student: MoodleImportStudent, index) => {
      console.log(`Transforming student ${index + 1}:`, student);
      const transformed = {
        name: student.name || '',
        email: student.email || '',
        grade: student.grade || '',
        feedback: student.feedback || '',
        appliedIds: student.appliedIds || [],
        identifier: student.idNumber || '',
        idNumber: student.idNumber || '',
        status: student.status || '',
        lastModifiedSubmission: student.lastModifiedSubmission || '',
        onlineText: student.onlineText || '',
        lastModifiedGrade: student.lastModifiedGrade || '',
        maxGrade: maxGrade,
        gradeCanBeChanged: student.gradeCanBeChanged || 'Yes'
      };
      console.log(`Transformed student ${index + 1}:`, transformed);
      return transformed;
    });

    const finalData = {
      ...parsedData,
      students: transformedStudents,
      maxGrade: maxGrade
    };
    
    console.log('Final transformed data:', JSON.stringify(finalData, null, 2));
    return finalData;
  } catch (error) {
    console.error('Error in getImportedMoodleData:', error);
    return null;
  }
} 