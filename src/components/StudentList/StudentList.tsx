import React, { useState, useEffect, useRef } from "react";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import { Student, SaveData, ChangeRecord } from './types';
import TableHeaderComponent from './components/TableHeader';
import TableBodyComponent from './components/TableBody';
import FileControls from './components/FileControls';
import { useCSVHandling } from './hooks';
import './StudentList.css';
import { getImportedMoodleData } from '@/utils/moodleDataImport';
import AutoSaveDebugPanel from './components/AutoSaveDebugPanel';

// Add type declaration for FileSystemFileHandle
declare global {
  interface Window {
    showSaveFilePicker: (options?: {
      types?: Array<{
        description: string;
        accept: Record<string, string[]>;
      }>;
      suggestedName?: string;
    }) => Promise<FileSystemFileHandle>;
  }
}

// Define the component with inline props type
const StudentList: React.FC<{
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedStudent: string | null;
  onStudentSelect: (student: string) => void;
  assignmentName: string;
  setAssignmentName: React.Dispatch<React.SetStateAction<string>>;
  onChangeTracked: (change: ChangeRecord) => void;
  onSaveProgress?: () => Promise<boolean>;
  feedbackItems: any[];
  setFeedbackItems: React.Dispatch<React.SetStateAction<any[]>>;
  onLastAutoSaveTimeUpdate: (time: string) => void;
  selectedFeedbackId: number | null;
  onFeedbackSelect: (feedbackId: number | null) => void;
}> = ({
  students,
  setStudents,
  selectedStudent,
  onStudentSelect,
  assignmentName,
  setAssignmentName,
  onChangeTracked,
  onSaveProgress,
  feedbackItems,
  setFeedbackItems,
  onLastAutoSaveTimeUpdate,
  selectedFeedbackId,
  onFeedbackSelect,
}) => {
  console.log('StudentList received students:', students);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [error, setError] = useState<string>("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [showAutoSaveStatus, setShowAutoSaveStatus] = useState<boolean>(false);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  
  // Refs for auto-save
  const lastSaveTimeRef = useRef<number>(Date.now());
  const hasUnsavedChangesRef = useRef<boolean>(false);
  const lastSavedDataRef = useRef<string>('');
  const autoSaveIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { handleFileChange, exportForMoodle } = useCSVHandling(
    setStudents, 
    assignmentName, 
    students,
    onChangeTracked
  );

  // Add these new state variables
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [saveHistory, setSaveHistory] = useState<Array<{
    timestamp: number;
    success: boolean;
    dataSize: number;
  }>>([]);

  // Add this state
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Add this state variable to track the last auto-save time
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');

  // Add a keyboard shortcut to toggle the debug panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebugPanel(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check for Moodle data when component mounts
  useEffect(() => {
    const moodleData = getImportedMoodleData();
    if (moodleData) {
      setStudents(moodleData);
      // Optionally set assignment name if you have it in your state
      // setAssignmentName(decodeURIComponent(moodleData.assignmentName));
    }
    
    // Try to restore file handle from previous session
    const tryRestoreFileHandle = async () => {
      try {
        const savedFileName = localStorage.getItem('lastSaveFileName');
        if (savedFileName) {
          // We can't directly restore the file handle, but we can show the user
          // that auto-save will be available after they save once
          setAutoSaveStatus('Auto-save will be enabled after you save once');
          setShowAutoSaveStatus(true);
          setTimeout(() => {
            setShowAutoSaveStatus(false);
          }, 5000);
        }
      } catch (error) {
        console.error('Error restoring file handle:', error);
      }
    };
    
    tryRestoreFileHandle();
  }, []);

  // Modify the track changes useEffect to not show indicators
  useEffect(() => {
    if (students.length > 0 || feedbackItems.length > 0) {
      const currentData = JSON.stringify({ students, feedbackItems });
      
      // Only mark as having unsaved changes if the data is different from last saved data
      if (currentData !== lastSavedDataRef.current) {
        hasUnsavedChangesRef.current = true;
        
        // We're removing the indicator here - just silently track changes
        // No more setAutoSaveStatus or setShowAutoSaveStatus
      }
    }
  }, [students, feedbackItems]);

  // Update the auto-save interval effect to be more reliable
  useEffect(() => {
    console.log('Setting up auto-save interval');
    
    // Force auto-save to run exactly every 1 minute (60000 ms)
    const intervalId = setInterval(() => {
      const now = Date.now();
      
      console.log('Auto-save check running with conditions:');
      console.log(`- Has data: ${students.length > 0 || feedbackItems.length > 0}`);
      console.log(`- Has file handle: ${!!fileHandle}`);
      console.log(`- Has unsaved changes: ${hasUnsavedChangesRef.current}`);
      console.log(`- Time since last save: ${(now - lastSaveTimeRef.current) / 1000}s`);
      
      // Only run auto-save if we have data and a file handle
      if ((students.length > 0 || feedbackItems.length > 0) && fileHandle) {
        // Check if it's been at least 1 minute since the last save
        if (now - lastSaveTimeRef.current >= 60000) {
          console.log('🔄 Auto-save triggered!');
          
          // Even if there are no changes, we'll still show the auto-save notification
          // This ensures the user sees auto-save happening every 1 minute
          setIsSaving(true);
          
          // Use the existing save function
          handleSaveProgress(true)
            .then(async (success) => {
              if (success) {
                // Verify the file was actually written correctly
                if (fileHandle) {
                  try {
                    // Read the file back to verify its contents
                    const file = await fileHandle.getFile();
                    const contents = await file.text();
                    const savedData = JSON.parse(contents);
                    
                    // Check if the file contains the expected data
                    const currentData = { students, feedbackItems };
                    const savedStudentsCount = savedData.students?.length || 0;
                    const currentStudentsCount = students.length;
                    
                    console.log(`File verification: Found ${savedStudentsCount} students in file, expected ${currentStudentsCount}`);
                    
                    if (savedStudentsCount !== currentStudentsCount) {
                      console.error('❌ File verification failed: Student count mismatch');
                      // Try to save again
                      console.log('Attempting to save again...');
                      await handleSaveProgress(true);
                      return;
                    }
                    
                    // If we get here, the file was written correctly
                    console.log('✅ File verification passed: File contains correct data');
                    
                    // Update last save time
                    lastSaveTimeRef.current = now;
                    
                    // Update last saved data
                    lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
                    
                    // Reset unsaved changes flag
                    hasUnsavedChangesRef.current = false;
                    
                    // Format current time for display
                    const timeString = new Date().toLocaleTimeString();
                    setLastAutoSaveTime(timeString);
                    console.log(`Setting last auto-save time to: ${timeString}`);
                    
                    // Pass the timestamp up to the parent component
                    onLastAutoSaveTimeUpdate(timeString);
                    console.log(`Passed last auto-save time to parent: ${timeString}`);
                    
                    // Always show auto-save status message
                    setAutoSaveStatus(`Auto-saved at ${timeString}`);
                    setShowAutoSaveStatus(true);
                    
                    // Make the message visible for longer (7 seconds)
                    setTimeout(() => {
                      setShowAutoSaveStatus(false);
                    }, 7000);
                    
                    // Reset saving state
                    setIsSaving(false);
                    
                    console.log('✅ Auto-save completed successfully');
                  } catch (error) {
                    console.error('❌ File verification failed:', error);
                    setIsSaving(false);
                    
                    // Show error message
                    setAutoSaveStatus('Auto-save verification failed. Will try again soon.');
                    setShowAutoSaveStatus(true);
                    
                    // Hide the error message after 5 seconds
                    setTimeout(() => {
                      setShowAutoSaveStatus(false);
                    }, 5000);
                  }
                } else {
                  // No file handle, but save reported success (download case)
                  // Update last save time
                  lastSaveTimeRef.current = now;
                  
                  // Update last saved data
                  lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
                  
                  // Reset unsaved changes flag
                  hasUnsavedChangesRef.current = false;
                  
                  // Format current time for display
                  const timeString = new Date().toLocaleTimeString();
                  setLastAutoSaveTime(timeString);
                  
                  // Pass the timestamp up to the parent component
                  onLastAutoSaveTimeUpdate(timeString);
                  
                  // Always show auto-save status message
                  setAutoSaveStatus(`Auto-saved at ${timeString}`);
                  setShowAutoSaveStatus(true);
                  
                  // Make the message visible for longer (7 seconds)
                  setTimeout(() => {
                    setShowAutoSaveStatus(false);
                  }, 7000);
                  
                  // Reset saving state
                  setIsSaving(false);
                  
                  console.log('✅ Auto-save completed successfully (download mode)');
                }
              } else {
                // Save reported failure
                setIsSaving(false);
                console.error('❌ Auto-save failed: Save function returned false');
                
                // Show error message
                setAutoSaveStatus('Auto-save failed. Will try again soon.');
                setShowAutoSaveStatus(true);
                
                // Hide the error message after 5 seconds
                setTimeout(() => {
                  setShowAutoSaveStatus(false);
                }, 5000);
              }
            })
            .catch(error => {
              setIsSaving(false);
              console.error('❌ Auto-save failed:', error);
              
              // Show error message
              setAutoSaveStatus('Auto-save failed. Will try again soon.');
              setShowAutoSaveStatus(true);
              
              // Hide the error message after 5 seconds
              setTimeout(() => {
                setShowAutoSaveStatus(false);
              }, 5000);
            });
        } else {
          console.log(`⏳ Next auto-save in ${((60000 - (now - lastSaveTimeRef.current)) / 1000).toFixed(0)} seconds`);
        }
      } else {
        console.log('❌ Auto-save conditions not met (missing data or file handle)');
      }
    }, 60000); // 👈 Changed from 120000 to 60000 (1 minute)
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [fileHandle]); // Only re-create the interval when the file handle changes

  // Check if File System Access API is supported
  useEffect(() => {
    const isFileSystemAccessSupported = 'showSaveFilePicker' in window;
    console.log('File System Access API supported:', isFileSystemAccessSupported);
    
    if (!isFileSystemAccessSupported) {
      console.warn('File System Access API not supported - auto-save will not be available');
      setAutoSaveStatus('Auto-save not available in this browser');
      setShowAutoSaveStatus(true);
      setTimeout(() => {
        setShowAutoSaveStatus(false);
      }, 5000);
    }
  }, []);

  // Fix the date comparison
  const columns: ColumnDef<Student>[] = [
    { accessorKey: "name", header: "Name", cell: info => info.getValue() },
    { accessorKey: "email", header: "Email", cell: info => info.getValue() },
    {
      accessorKey: "lastModifiedSubmission",
      header: "Last Modified",
      cell: info => info.getValue(),
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.lastModifiedSubmission || '';
        const dateB = rowB.original.lastModifiedSubmission || '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
    },
    {
      accessorKey: "grade",
      header: "Grade",
      cell: info => info.getValue() || '',
      sortingFn: (rowA, rowB) =>
        parseInt(rowA.original.grade || '0') - parseInt(rowB.original.grade || '0'),
    },
    { 
      accessorKey: "feedback", 
      header: "Feedback", 
      cell: info => (
        <div style={{ whiteSpace: 'pre-line' }}>
          {(info.getValue() as string) || ''}
        </div>
      )
    },
  ];

  const table = useReactTable({
    data: students,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handle saving progress to localStorage
  const handleSaveProgress = async (autoSave = false): Promise<boolean> => {
    console.log('handleSaveProgress called with autoSave =', autoSave);
    setIsSaving(true);
    
    try {
      // Check if we have any data to save
      if (students.length === 0) {
        console.error('No students to save');
        setError('No data to save. Please import students first.');
        setIsSaving(false);
        return false;
      }
      
      const data = {
        students,
        assignmentName,
        timestamp: new Date().toISOString(),
        feedbackItems
      };
      
      console.log('Data prepared for saving:', {
        studentsCount: students.length,
        assignmentName,
        feedbackItemsCount: feedbackItems.length
      });
      
      const jsonData = JSON.stringify(data, null, 2);
      console.log(`JSON data size: ${jsonData.length} bytes`);
      
      // If we already have a file handle, use it
      if (fileHandle) {
        try {
          console.log(`Saving to existing file: ${fileHandle.name}`);
          
          // Check if we have permission to write to the file
          const permissionStatus = await fileHandle.queryPermission({ mode: 'readwrite' });
          if (permissionStatus !== 'granted') {
            console.log('Requesting permission to write to file...');
            const newPermissionStatus = await fileHandle.requestPermission({ mode: 'readwrite' });
            if (newPermissionStatus !== 'granted') {
              throw new Error('Permission to write to file was denied');
            }
          }
          
          // Create a writable stream
          const writable = await fileHandle.createWritable();
          
          // Write the data
          await writable.write(jsonData);
          
          // Close the stream
          await writable.close();
          
          console.log('✅ File write completed');
          
          // Update last save time
          lastSaveTimeRef.current = Date.now();
          
          // Update last saved data
          lastSavedDataRef.current = jsonData;
          
          // Reset unsaved changes flag
          hasUnsavedChangesRef.current = false;
          
          // Format current time for display
          const timeString = new Date().toLocaleTimeString();
          setLastAutoSaveTime(timeString);
          
          // Pass the timestamp up to the parent component
          onLastAutoSaveTimeUpdate(timeString);
          
          // Only show status message if it's not an auto-save
          if (!autoSave) {
            setAutoSaveStatus(`Saved at ${timeString}`);
            setShowAutoSaveStatus(true);
            setTimeout(() => {
              setShowAutoSaveStatus(false);
            }, 3000);
          }
          
          // Set isSaving back to false
          setIsSaving(false);
          return true;
        } catch (error) {
          console.error('Error saving to file:', error);
          
          // If this was triggered by auto-save, don't show a download dialog
          if (autoSave) {
            setIsSaving(false);
            return false;
          }
          
          // For manual saves, fall back to download method
          try {
            console.log('Falling back to download method');
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_progress.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setAutoSaveStatus('File saved as download (auto-save disabled)');
            setShowAutoSaveStatus(true);
            setTimeout(() => {
              setShowAutoSaveStatus(false);
            }, 5000);
            
            // Reset file handle since we couldn't write to it
            setFileHandle(null);
            localStorage.removeItem('lastSaveFileName');
            
            // Set isSaving back to false
            setIsSaving(false);
            return true;
          } catch (fallbackError) {
            console.error('Fallback save method failed:', fallbackError);
            setError('Failed to save progress. Please try again.');
            setIsSaving(false);
            return false;
          }
        }
      } else if ('showSaveFilePicker' in window && !autoSave) {
        // Only show the file picker for manual saves, not auto-saves
        try {
          // No file handle yet, prompt user to create a file
          const options = {
            suggestedName: `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_progress.json`,
            types: [
              {
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] }
              }
            ]
          };
          
          console.log('Showing save file picker...');
          const newFileHandle = await window.showSaveFilePicker(options);
          console.log('User selected file:', newFileHandle.name);
          
          setFileHandle(newFileHandle);
          localStorage.setItem('lastSaveFileName', newFileHandle.name);
          
          console.log('Creating writable stream...');
          const writable = await newFileHandle.createWritable();
          
          console.log('Writing data to file...');
          await writable.write(jsonData);
          
          console.log('Closing writable stream...');
          await writable.close();
          
          console.log('Data saved to new file');
          
          // Show a special message for first save
          setAutoSaveStatus('Progress saved successfully. Auto-save is now enabled.');
          setShowAutoSaveStatus(true);
          setTimeout(() => {
            setShowAutoSaveStatus(false);
          }, 5000);
          
          // Update last save time
          lastSaveTimeRef.current = Date.now();
          
          // Update last saved data
          lastSavedDataRef.current = jsonData;
          
          // Reset unsaved changes flag
          hasUnsavedChangesRef.current = false;
          
          // Format current time for display
          const timeString = new Date().toLocaleTimeString();
          setLastAutoSaveTime(timeString);
          
          // Pass the timestamp up to the parent component
          onLastAutoSaveTimeUpdate(timeString);
          
          // Set isSaving back to false
          setIsSaving(false);
          return true;
        } catch (error) {
          console.error('Save operation failed:', error);
          
          // Check if it's an AbortError (user canceled)
          if (error.name === 'AbortError') {
            console.log('Save operation was canceled by the user');
            setIsSaving(false);
            return false;
          }
          
          // For manual saves, fall back to download method
          try {
            console.log('Falling back to download method');
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_progress.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setAutoSaveStatus('File saved as download (auto-save disabled)');
            setShowAutoSaveStatus(true);
            setTimeout(() => {
              setShowAutoSaveStatus(false);
            }, 5000);
            
            // Set isSaving back to false
            setIsSaving(false);
            return true;
          } catch (fallbackError) {
            console.error('Fallback save method failed:', fallbackError);
            setError('Failed to save progress. Please try again.');
            setIsSaving(false);
            return false;
          }
        }
      } else {
        // This is either an auto-save without a file handle, or a browser without File System Access API
        
        // For auto-saves without a file handle, just silently return
        if (autoSave) {
          console.log('Auto-save skipped - no file handle available');
          setIsSaving(false);
          return false;
        }
        
        // For manual saves in browsers without File System Access API, use download method
        try {
          console.log('Using download method for browsers without File System Access API');
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${assignmentName.toLowerCase().replace(/\s+/g, '_')}_progress.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setAutoSaveStatus('Progress saved as download');
          setShowAutoSaveStatus(true);
          setTimeout(() => {
            setShowAutoSaveStatus(false);
          }, 3000);
          
          // Update last save time
          lastSaveTimeRef.current = Date.now();
          
          // Update last saved data
          lastSavedDataRef.current = jsonData;
          
          // Reset unsaved changes flag
          hasUnsavedChangesRef.current = false;
          
          // Format current time for display
          const timeString = new Date().toLocaleTimeString();
          setLastAutoSaveTime(timeString);
          
          // Pass the timestamp up to the parent component
          onLastAutoSaveTimeUpdate(timeString);
          
          // Set isSaving back to false
          setIsSaving(false);
          return true;
        } catch (error) {
          console.error('Error saving progress:', error);
          setError('Failed to save progress. Please try again.');
          setIsSaving(false);
          return false;
        }
      }
    } catch (error) {
      setIsSaving(false);
      console.error('Error preparing data for save:', error);
      setError('Failed to prepare data for saving. Please try again.');
      return false;
    }
  };

  // Enhanced file verification function
  const verifyFileContents = async (fileHandle: FileSystemFileHandle, expectedStudentCount: number): Promise<boolean> => {
    try {
      const file = await fileHandle.getFile();
      const contents = await file.text();
      
      try {
        const data = JSON.parse(contents);
        console.log('File verification: File contains valid JSON data.');
        
        if (!data.students || !Array.isArray(data.students)) {
          console.error('File verification failed: No students array in file');
          return false;
        }
        
        console.log(`File contains data for ${data.students.length} students, expected ${expectedStudentCount}`);
        
        if (data.students.length !== expectedStudentCount) {
          console.error('File verification failed: Student count mismatch');
          return false;
        }
        
        // Check if the grades in the file match the current grades
        const currentStudentData = JSON.stringify(students);
        const savedStudentData = JSON.stringify(data.students);
        
        if (currentStudentData !== savedStudentData) {
          console.error('File verification failed: Student data mismatch');
          console.log('Current student data:', students);
          console.log('Saved student data:', data.students);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('File verification failed: Invalid JSON in file', error);
        return false;
      }
    } catch (error) {
      console.error('File verification failed: Could not read file', error);
      return false;
    }
  };

  // Handle loading progress from a file
  const handleLoadProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as SaveData;
        
        setStudents(data.students);
        setAssignmentName(data.assignmentName);
        if (Array.isArray(data.feedbackItems) && data.feedbackItems.length > 0) {
          setFeedbackItems(data.feedbackItems);
        }
        
        // Update last saved data reference
        lastSavedDataRef.current = JSON.stringify({ 
          students: data.students, 
          feedbackItems: data.feedbackItems || [] 
        });
        
        // Reset unsaved changes flag
        hasUnsavedChangesRef.current = false;
        
        // Track the import
        onChangeTracked({
          type: 'import',
          studentName: 'System',
          timestamp: new Date().toISOString(),
          message: 'Progress data imported',
          oldValue: '',
          newValue: ''
        });
        
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setError("Invalid progress file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="layout">
      <div className="listSection">
        <FileControls
          onFileImport={handleFileChange}
          onExport={exportForMoodle}
          onSaveProgress={handleSaveProgress}
          onLoadProgress={handleLoadProgress}
          error={error}
          autoSaveStatus={autoSaveStatus}
          showAutoSaveStatus={showAutoSaveStatus}
          hasData={students.length > 0}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChangesRef.current}
          lastAutoSaveTime={lastAutoSaveTime}
        />
        <div className="rounded-md border">
          <div className="table-container">
            <Table>
              <TableHeaderComponent headerGroups={table.getHeaderGroups()} />
              <TableBodyComponent
                rows={table.getRowModel().rows}
                selectedStudent={selectedStudent}
                onStudentSelect={onStudentSelect}
                selectedFeedbackId={selectedFeedbackId}
              />
            </Table>
          </div>
        </div>
      </div>

      <AutoSaveDebugPanel
        isVisible={showDebugPanel}
        lastSaveTime={lastSaveTimeRef.current}
        hasUnsavedChanges={hasUnsavedChangesRef.current}
        fileHandle={fileHandle}
        saveHistory={saveHistory}
      />
    </div>
  );
};

export default StudentList;
