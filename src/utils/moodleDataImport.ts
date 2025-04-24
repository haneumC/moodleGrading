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
    const data = sessionStorage.getItem('moodleGradingData');
    if (!data) return null;

    const parsedData = JSON.parse(data) as MoodleImportData;
    if (!parsedData || !Array.isArray(parsedData.students)) return null;

    // Use the max grade from the imported data
    const maxGrade = parsedData.maxGrade || '100.00';

    // Transform the data
    const transformedStudents: Student[] = parsedData.students.map((student: MoodleImportStudent) => ({
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
    }));

    return {
      ...parsedData,
      students: transformedStudents,
      maxGrade: maxGrade
    };
  } catch (error) {
    console.error('Error parsing Moodle data:', error);
    return null;
  }
} 