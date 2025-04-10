import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Feedback from './components/Feedback/Feedback';
import StudentList from './components/StudentList/StudentList';
import { HashRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import AboutPage from './components/About/About';
import { Student, ChangeRecord, FeedbackItem } from '@/components/StudentList/types';
import ChangeHistoryPanel from './components/StudentList/components/ChangeHistoryPanel';
import { saveAs } from 'file-saver';

const MAX_CHANGES = 50;
const SAVE_HANDLE_KEY = 'save_handle_id';

const defaultFeedback: FeedbackItem[] = [
  { id: 1, comment: "Add more comments", grade: 3 },
  { id: 2, comment: "Poor indentation", grade: 2 },
  { id: 3, comment: "Looks good!", grade: 0 },
  { id: 4, comment: "No submission", grade: 20 },
];

interface MoodleMessage {
  type: 'MOODLE_DATA';
  data: {
    assignmentName: string;
    students: MoodleStudent[];
    timestamp: string;
  };
}

interface StorageData {
  moodleGradingData?: {
    assignmentName: string;
    students: MoodleStudent[];
    timestamp: string;
  };
}

declare global {
  interface Window {
    chrome: {
      runtime: {
        onMessage: {
          addListener: (callback: (message: MoodleMessage, sender: unknown, sendResponse: () => void) => void) => void;
          removeListener: (callback: (message: MoodleMessage, sender: unknown, sendResponse: () => void) => void) => void;
        };
        sendMessage: (message: MoodleMessage) => void;
      };
      storage: {
        local: {
          get: (keys: string[], callback: (result: StorageData) => void) => void;
          set: (items: StorageData, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
      };
    };
    showOpenFilePicker: (options?: {
      id?: string;
      startIn?: string;
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }
}

type MoodleStudent = {
  name: string;
  email: string;
  idNumber?: string;
  status?: string;
  grade?: string;
  lastModifiedSubmission?: string;
  feedback?: string;
  appliedIds?: number[];
  onlineText?: string;
  lastModifiedGrade?: string;
}

const MainApp = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [assignmentName, setAssignmentName] = useState<string>("Assignment 1");
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(defaultFeedback);
  
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([]);
  const [isChangeHistoryVisible, setIsChangeHistoryVisible] = useState(false);
  const [savedFileHandle, setSavedFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(null);

  useEffect(() => {
    // Check chrome.storage.local for data
    if (window.chrome?.storage?.local) {
      window.chrome.storage.local.get(['moodleGradingData'], (result) => {
        if (result.moodleGradingData) {
          try {
            const parsedData = result.moodleGradingData;
            console.log('Found Moodle data:', parsedData);
            
            if (parsedData.students && Array.isArray(parsedData.students)) {
              console.log('Found valid students array:', parsedData.students);
              
              const transformedStudents: Student[] = parsedData.students.map((student: MoodleStudent) => ({
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
                maxGrade: '20.00',
                gradeCanBeChanged: 'Yes'
              }));
              
              console.log('Setting students state with:', transformedStudents);
              setStudents(transformedStudents);
              
              if (parsedData.assignmentName) {
                console.log('Setting assignment name:', parsedData.assignmentName);
                setAssignmentName(parsedData.assignmentName);
              }
            }
            
            // Clear the data after loading
            window.chrome.storage.local.remove('moodleGradingData');
          } catch (error) {
            console.error('Error parsing Moodle data:', error);
          }
        }
      });
    }
  }, []);

  // Try to restore saved file handle on mount
  useEffect(() => {
    const handleId = localStorage.getItem(SAVE_HANDLE_KEY);
    if (handleId) {
      // Attempt to restore the file handle
      navigator.storage?.getDirectory?.()?.then(async (root) => {
        try {
          const handle = await root.getFileHandle(handleId);
          if (handle) {
            setSavedFileHandle(handle);
            console.log('File handle restored successfully');
          }
        } catch (err) {
          console.error('Could not restore file handle:', err);
          localStorage.removeItem(SAVE_HANDLE_KEY);
        }
      });
    }
  }, []);

  const handleChangeTracked = (change: ChangeRecord) => {
    // Only track grade and feedback changes, ignore auto-saves
    if (change.type !== 'grade' && change.type !== 'feedback') return;

    setChangeHistory(prev => {
      let message = '';
      if (change.type === 'grade') {
        message = `${change.studentName}: ${change.oldValue} → ${change.newValue} points`;
      } else if (change.type === 'feedback') {
        const oldValue = change.oldValue as { grade: string; feedback: string; appliedIds: number[] };
        const newValue = change.newValue as { grade: string; feedback: string; appliedIds: number[] };
        message = `${change.studentName}: ${oldValue.grade || '0'} → ${newValue.grade} points`;
      }

      const newChange = {
        ...change,
        message,
        timestamp: new Date().toISOString()
      };

      // Prevent duplicate entries within 1 second
      if (prev.length > 0) {
        const lastChange = prev[0];
        if (
          lastChange.studentName === change.studentName &&
          lastChange.type === change.type &&
          Math.abs(new Date(lastChange.timestamp).getTime() - Date.now()) < 1000
        ) {
          return prev;
        }
      }

      return [newChange, ...prev.slice(0, MAX_CHANGES - 1)];
    });
  };

  const handleRevertChange = (change: ChangeRecord) => {
    if (!change.studentName) return;

    // Revert the student's state
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.name === change.studentName) {
          if (change.type === 'grade') {
            return { ...student, grade: change.oldValue as string };
          } else if (change.type === 'feedback') {
            const oldValue = change.oldValue as { grade: string; feedback: string; appliedIds: number[] };
            return {
              ...student,
              grade: oldValue.grade,
              feedback: oldValue.feedback,
              appliedIds: oldValue.appliedIds
            };
          }
        }
        return student;
      })
    );

    // Only remove the specific change from history
    setChangeHistory(prev => 
      prev.filter(c => 
        !(c.timestamp === change.timestamp && 
          c.studentName === change.studentName)
      )
    );
  };

  const handleFeedbackEdit = (oldFeedback: FeedbackItem, newFeedback: FeedbackItem) => {
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (Array.isArray(student.appliedIds) && student.appliedIds.includes(oldFeedback.id)) {
          // Replace old feedback text with new one
          const updatedFeedback = student.feedback
            .split('\n\n')
            .map(line => line.trim() === oldFeedback.comment.trim() ? newFeedback.comment : line)
            .join('\n\n');

          // Recalculate grade
          const totalDeduction = student.appliedIds.reduce((sum, id) => {
            if (id === oldFeedback.id) {
              return sum + newFeedback.grade;
            }
            const feedback = feedbackItems.find(f => f.id === id);
            return sum + (feedback?.grade || 0);
          }, 0);

          const newGrade = Math.max(0, 20 - totalDeduction);

          // Dispatch a custom event to mark unsaved changes
          window.dispatchEvent(new CustomEvent('grading-change'));
          
          return {
            ...student,
            feedback: updatedFeedback,
            grade: newGrade.toString(),
          };
        }
        return student;
      })
    );
  };

  // First, define handleLastAutoSaveTimeUpdate before saveData
  const handleLastAutoSaveTimeUpdate = (time: string) => {
    console.log(`Received last auto-save time in App: ${time}`);
    setLastAutoSaveTime(time);
  };

  // Then define saveData which uses handleLastAutoSaveTimeUpdate
  const saveData = useCallback(async (showStatus: boolean = false, _isAuto: boolean = false) => {
    console.log(`saveData called with showStatus=${showStatus}, isAuto=${_isAuto}`);
    
    try {
      const saveData = {
        students,
        assignmentName,
        timestamp: new Date().toISOString(),
        feedbackItems
      };
      const jsonString = JSON.stringify(saveData, null, 2);
      console.log('Preparing to save data:', {
        studentsCount: students.length,
        feedbackItemsCount: feedbackItems.length,
        dataSize: jsonString.length
      });

      if (!savedFileHandle) {
        // No file handle exists, prompt user to save a new file
        if ('showSaveFilePicker' in window) {
          try {
            const options = {
              suggestedName: `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_progress.json`,
              types: [{
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] },
              }],
            };

            const handle = await window.showSaveFilePicker(options);
            setSavedFileHandle(handle);
            localStorage.setItem(SAVE_HANDLE_KEY, handle.name);

            const writable = await handle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            console.log('Data saved to new file');
            
            // Update last auto-save time
            const timeString = new Date().toLocaleTimeString();
            handleLastAutoSaveTimeUpdate(timeString);
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
              console.log('Save operation was cancelled by the user.');
              return false; // Exit if the user cancels the save dialog
            } else {
              console.error('Save error:', err);
              return false;
            }
          }
        } else {
          // Fallback for browsers without File System API
          try {
            const blob = new Blob([jsonString], { type: 'application/json' });
            saveAs(blob, `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_progress.json`);
          } catch (err) {
            console.error('Error saving file:', err);
            return false;
          }
        }
      } else {
        // File handle exists, save to the existing file
        try {
          console.log(`Attempting to save to existing file: ${savedFileHandle.name}`);
          
          // Check if we have permission to write to the file
          const permissionStatus = await savedFileHandle.queryPermission({ mode: 'readwrite' });
          console.log(`File permission status: ${permissionStatus}`);
          
          if (permissionStatus !== 'granted') {
            console.log('Requesting permission to write to file...');
            const newPermissionStatus = await savedFileHandle.requestPermission({ mode: 'readwrite' });
            console.log(`New permission status: ${newPermissionStatus}`);
            
            if (newPermissionStatus !== 'granted') {
              console.error('Permission to write to file was denied');
              return false;
            }
          }
          
          console.log('Creating writable stream...');
          const writable = await savedFileHandle.createWritable();
          
          console.log(`Writing ${jsonString.length} bytes to file...`);
          await writable.write(jsonString);
          
          console.log('Closing writable stream...');
          await writable.close();
          
          console.log('✅ File write completed successfully');
          
          // Update last auto-save time
          const timeString = new Date().toLocaleTimeString();
          handleLastAutoSaveTimeUpdate(timeString);
        } catch (err) {
          console.error('Error saving to existing file:', err);
          // If permission was revoked or file is no longer accessible
          setSavedFileHandle(null);
          localStorage.removeItem(SAVE_HANDLE_KEY);
          return false;
        }
      }

      if (showStatus) {
        console.log('Data saved successfully');
      }
      
      return true;
    } catch (err) {
      console.error('Save error:', err);
      return false;
    }
  }, [students, feedbackItems, assignmentName, savedFileHandle, handleLastAutoSaveTimeUpdate]);

  // Function to handle feedback selection
  const handleFeedbackSelect = (feedbackId: number | null) => {
    console.log('App received feedback selection:', feedbackId);
    
    // Debug: Log all students who have this feedback applied
    if (feedbackId !== null) {
      const studentsWithFeedback = students.filter(student => 
        Array.isArray(student.appliedIds) && student.appliedIds.includes(feedbackId)
      );
      console.log('Students with this feedback:', studentsWithFeedback.map(s => s.name));
    }
    
    // Toggle selection if clicking the same feedback again
    if (selectedFeedbackId === feedbackId) {
      console.log('Deselecting feedback:', feedbackId);
      setSelectedFeedbackId(null);
    } else {
      console.log('Selecting feedback:', feedbackId);
      setSelectedFeedbackId(feedbackId);
    }
  };

  const handleFileHandleCreated = (handle: FileSystemFileHandle) => {
    console.log('Received file handle in App component:', handle);
    setSavedFileHandle(handle);
    
    // Store a reference to indicate we have a file handle
    localStorage.setItem('hasFileHandle', 'true');
  };

  return (
    <div className="grading-assistant relative">
      <button 
        onClick={() => navigate('/about')}
        className="absolute top-4 right-4 text-white hover:text-gray-200 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        About Us
      </button>

      <div className="changes-section absolute top-16 right-4">
        <button 
          onClick={() => setIsChangeHistoryVisible(!isChangeHistoryVisible)}
          className="text-white hover:text-gray-200 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-between"
        >
          <span>{isChangeHistoryVisible ? 'Hide Changes' : 'Show Changes'}</span>
          <span className="bg-gray-700 px-2 py-0.5 rounded-full text-sm">
            {changeHistory.length}
          </span>
        </button>
        
        {/* Display the last auto-save time below the Show Changes button */}
        {lastAutoSaveTime && (
          <div className="last-autosave-header">
            Last auto-save: {lastAutoSaveTime}
          </div>
        )}
      </div>

      {/* Change History Panel */}
      {isChangeHistoryVisible && (
        <ChangeHistoryPanel
          changeHistory={changeHistory}
          onClose={() => setIsChangeHistoryVisible(false)}
          onRevert={handleRevertChange}
        />
      )}

      {/* Main content */}
      <header>
        <div>
          <h1>Grading Assistant</h1>
          <input
            type="text"
            value={assignmentName}
            onChange={(e) => setAssignmentName(e.target.value)}
            className="text-lg font-semibold px-2 py-1 border rounded"
          />
          <p>Max Points: 20.00</p>
        </div>
      </header>
      <main>
        <div className="left">
          <Feedback
            selectedStudent={selectedStudent}
            appliedIds={students.find(s => s.name === selectedStudent)?.appliedIds || []}
            onFeedbackEdit={handleFeedbackEdit}
            feedbackItems={feedbackItems}
            setFeedbackItems={setFeedbackItems}
            students={students}
            onStudentsUpdate={setStudents}
            onChangeTracked={handleChangeTracked}
            onFeedbackSelect={handleFeedbackSelect}
            selectedFeedbackId={selectedFeedbackId}
          />
        </div>
        <div className="right">
          <StudentList
            students={students}
            setStudents={setStudents}
            selectedStudent={selectedStudent}
            onStudentSelect={setSelectedStudent}
            assignmentName={assignmentName}
            setAssignmentName={setAssignmentName}
            feedbackItems={feedbackItems}
            setFeedbackItems={setFeedbackItems}
            onChangeTracked={handleChangeTracked}
            onLastAutoSaveTimeUpdate={handleLastAutoSaveTimeUpdate}
            selectedFeedbackId={selectedFeedbackId}
            onSaveData={saveData}
            onFileHandleCreated={handleFileHandleCreated}
          />
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
};

export default App;
