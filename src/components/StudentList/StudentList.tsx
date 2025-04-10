import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table } from "@/components/ui/table";
import { Student, SaveData, ChangeRecord, FeedbackItem } from './types';
import TableHeaderComponent from './components/TableHeader';
import TableBodyComponent from './components/TableBody';
import FileControls from './components/FileControls';
import { useCSVHandling } from './hooks';
import './StudentList.css';
import { getImportedMoodleData } from '@/utils/moodleDataImport';
import AutoSaveDebugPanel from './components/AutoSaveDebugPanel';

// Add these type declarations at the top of the file
interface FileSystemPermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

// Extend the FileSystemFileHandle interface
declare global {
  interface FileSystemFileHandle {
    queryPermission(descriptor: FileSystemPermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor: FileSystemPermissionDescriptor): Promise<PermissionState>;
  }
}

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

// Add this at the top of the file, outside the component
declare global {
  interface Window {
    markGradingChanges?: () => void;
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
  feedbackItems: FeedbackItem[];
  setFeedbackItems: React.Dispatch<React.SetStateAction<FeedbackItem[]>>;
  onLastAutoSaveTimeUpdate: (time: string) => void;
  selectedFeedbackId: number | null;
  onSaveData: (showStatus: boolean, isAuto: boolean) => Promise<boolean>;
  onFileHandleCreated: (handle: FileSystemFileHandle) => void;
}> = ({
  students,
  setStudents,
  selectedStudent,
  onStudentSelect,
  assignmentName,
  setAssignmentName,
  onChangeTracked,
  feedbackItems,
  setFeedbackItems,
  onLastAutoSaveTimeUpdate,
  selectedFeedbackId,
  onSaveData,
  onFileHandleCreated
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

  // Add a new state variable
  const [isNewImport, setIsNewImport] = useState<boolean>(false);

  const { handleFileChange: originalHandleFileChange, exportForMoodle } = useCSVHandling(
    setStudents, 
    assignmentName, 
    students,
    onChangeTracked
  );

  // Wrap the original handleFileChange to set isNewImport
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    originalHandleFileChange(e);
    setIsNewImport(true);
  };

  // Add these new state variables
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [saveHistory] = useState<Array<{
    timestamp: number;
    success: boolean;
    dataSize: number;
  }>>([]);

  // Add this state
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Add a state to track if a file is loaded but auto-save isn't enabled yet
  const [fileLoadedNoAutoSave, setFileLoadedNoAutoSave] = useState(false);

  // Move this ref outside of the useEffect
  const currentDataRef = useRef<string>('');

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

  // Add more detailed logging to the change detection
  useEffect(() => {
    if (students.length > 0 || feedbackItems.length > 0) {
      const currentData = JSON.stringify({ students, feedbackItems });
      
      // Only mark as having unsaved changes if the data is different from last saved data
      if (currentData !== lastSavedDataRef.current && lastSavedDataRef.current !== '') {
        console.log('Changes detected since last save');
        console.log('Current data length:', currentData.length);
        console.log('Last saved data length:', lastSavedDataRef.current.length);
        
        // For debugging, log a small sample of the differences
        if (currentData.length > 100 && lastSavedDataRef.current.length > 100) {
          console.log('Sample of current data:', currentData.substring(0, 100));
          console.log('Sample of last saved data:', lastSavedDataRef.current.substring(0, 100));
        }
        
        hasUnsavedChangesRef.current = true;
      } else if (lastSavedDataRef.current === '') {
        console.log('No previous saved data to compare against');
      } else {
        console.log('No changes detected since last save');
      }
    }
  }, [students, feedbackItems]);

  // First, let's add a function to mark changes when grading happens
  const markChanges = useCallback(() => {
    console.log('Grading changes detected');
    hasUnsavedChangesRef.current = true;
  }, []);

  // Add this to expose the function globally
  useEffect(() => {
    // Create a global function to mark changes
    window.markGradingChanges = markChanges;
    
    return () => {
      // Clean up
      delete window.markGradingChanges;
    };
  }, [markChanges]);

  // Add this function to check and request file permissions
  const verifyFilePermissions = async () => {
    if (!fileHandle) return false;
    
    try {
      // Check if we have permission to write to the file
      const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
      
      if (permission !== 'granted') {
        // Request permission
        const newPermission = await fileHandle.requestPermission({ mode: 'readwrite' });
        return newPermission === 'granted';
      }
      
      return true;
    } catch (err) {
      console.error('Error checking file permissions:', err);
      return false;
    }
  };

  // Replace the auto-save interval with a cleaner version
  useEffect(() => {
    // Only set up the interval if we have a file handle
    if (!fileHandle) return;
    
    console.log('Setting up auto-save interval');
    
    // Check every 60 seconds if there are changes to save
    const intervalId = setInterval(async () => {
      // Only auto-save if there are unsaved changes
      if (hasUnsavedChangesRef.current) {
        try {
          // Check if we have permission to write to the file
          const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
          
          if (permission !== 'granted') {
            // Request permission
            const newPermission = await fileHandle.requestPermission({ mode: 'readwrite' });
            
            if (newPermission !== 'granted') {
              console.error('Permission denied to write to file');
              return;
            }
          }
          
          // Show saving indicator
          setIsSaving(true);
          
          // Create the data to save
          const data = {
            students,
            feedbackItems,
            assignmentName,
            timestamp: new Date().toISOString()
          };
          
          // Convert to JSON
          const jsonData = JSON.stringify(data, null, 2);
          
          // Write to the file
          const writable = await fileHandle.createWritable();
          await writable.write(jsonData);
          await writable.close();
          
          // Update the last save time
          lastSaveTimeRef.current = Date.now();
          
          // Update the last saved data reference
          lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
          
          // Reset the unsaved changes flag
          hasUnsavedChangesRef.current = false;
          
          // Update the UI
          const timeString = new Date().toLocaleTimeString();
          onLastAutoSaveTimeUpdate(timeString);
          
          // Show a success message
          setAutoSaveStatus(`Auto-saved at ${timeString}`);
          setShowAutoSaveStatus(true);
          setTimeout(() => setShowAutoSaveStatus(false), 3000);
        } catch (err) {
          console.error('Error during auto-save:', err);
        } finally {
          // Reset saving state
          setIsSaving(false);
        }
      }
    }, 60000); // Check every 60 seconds
    
    return () => clearInterval(intervalId);
  }, [fileHandle, students, feedbackItems, assignmentName, onLastAutoSaveTimeUpdate]);

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

  // Add this useEffect to listen for grading changes
  useEffect(() => {
    const handleGradingChange = () => {
      console.log('Grading change detected via custom event');
      hasUnsavedChangesRef.current = true;
    };
    
    window.addEventListener('grading-change', handleGradingChange);
    
    return () => {
      window.removeEventListener('grading-change', handleGradingChange);
    };
  }, []);

  // Add this useEffect to log the file handle status whenever it changes
  useEffect(() => {
    console.log('File handle status changed:', fileHandle ? 'Available' : 'Not available');
    
    // If we have a file handle, make sure it's properly set in the parent component
    if (fileHandle) {
      console.log('Ensuring file handle is passed to parent');
      onFileHandleCreated(fileHandle);
    }
  }, [fileHandle, onFileHandleCreated]);

  // Add this useEffect to force a re-render when the file handle changes
  useEffect(() => {
    if (fileHandle) {
      console.log('File handle is available:', fileHandle);
      // Force a re-render by updating a state variable
      setAutoSaveStatus(prev => {
        if (prev === 'Auto-save enabled') return prev;
        return 'Auto-save enabled';
      });
    } else {
      console.log('No file handle available');
    }
  }, [fileHandle]);

  // Add this useEffect to retrieve the file handle when the component mounts
  useEffect(() => {
    const restoreFileHandle = async () => {
      try {
        const handle = await retrieveFileHandle();
        
        if (handle) {
          // Check if we still have permission to access the file
          const permission = await handle.queryPermission({ mode: 'readwrite' });
          
          if (permission === 'granted') {
            console.log('Restored file handle with permission');
            setFileHandle(handle);
            onFileHandleCreated(handle);
            
            // Update the auto-save status
            setAutoSaveStatus('Auto-save enabled');
            setShowAutoSaveStatus(true);
            setTimeout(() => {
              setShowAutoSaveStatus(false);
            }, 3000);
          } else {
            // We need to request permission
            const newPermission = await handle.requestPermission({ mode: 'readwrite' });
            
            if (newPermission === 'granted') {
              console.log('Restored file handle after requesting permission');
              setFileHandle(handle);
              onFileHandleCreated(handle);
              
              // Update the auto-save status
              setAutoSaveStatus('Auto-save enabled');
              setShowAutoSaveStatus(true);
              setTimeout(() => {
                setShowAutoSaveStatus(false);
              }, 3000);
            } else {
              console.log('Permission denied for restored file handle');
              setAutoSaveStatus('Auto-save permission denied. Please save manually.');
              setShowAutoSaveStatus(true);
              setTimeout(() => {
                setShowAutoSaveStatus(false);
              }, 5000);
            }
          }
        } else {
          console.log('No file handle found in storage');
        }
      } catch (err) {
        console.error('Error restoring file handle:', err);
      }
    };
    
    restoreFileHandle();
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

  // Update the handleSaveProgress function to enable auto-save
  const handleSaveProgress = async () => {
    try {
      setIsSaving(true);
      
      // If we already have a file handle, use it
      if (fileHandle) {
        // Check if we have permission to write to the file
        const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
        
        if (permission !== 'granted') {
          // Request permission
          const newPermission = await fileHandle.requestPermission({ mode: 'readwrite' });
          
          if (newPermission !== 'granted') {
            console.error('Permission denied to write to file');
            setError('Permission denied to write to file');
            setIsSaving(false);
            return false;
          }
        }
        
        // Create the data to save
        const data = {
          students,
          feedbackItems,
          assignmentName,
          timestamp: new Date().toISOString()
        };
        
        // Convert to JSON
        const jsonData = JSON.stringify(data, null, 2);
        
        // Write to the file
        const writable = await fileHandle.createWritable();
        await writable.write(jsonData);
        await writable.close();
        
        // Update the last save time
        lastSaveTimeRef.current = Date.now();
        
        // Update the last saved data reference
        lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
        
        // Reset the unsaved changes flag
        hasUnsavedChangesRef.current = false;
        
        // Update the UI
        const timeString = new Date().toLocaleTimeString();
        onLastAutoSaveTimeUpdate(timeString);
        
        // Show a success message
        setAutoSaveStatus(`Saved at ${timeString}`);
        setShowAutoSaveStatus(true);
        setTimeout(() => setShowAutoSaveStatus(false), 3000);
        
        setIsSaving(false);
        return true;
      } else {
        // We don't have a file handle yet, so create one (enable auto-save)
        console.log('No file handle yet, creating one...');
        
        // Show the file picker to get a new file handle
        const handle = await window.showSaveFilePicker({
          suggestedName: "grading_progress.json",
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });
        
        console.log('New file handle created:', handle);
        
        // Set the file handle in the component state
        setFileHandle(handle);
        
        // Pass the file handle to the parent component
        onFileHandleCreated(handle);
        
        // Save the current data to the file
        const data = {
          students,
          feedbackItems,
          assignmentName,
          timestamp: new Date().toISOString()
        };
        
        const jsonData = JSON.stringify(data, null, 2);
        
        const writable = await handle.createWritable();
        await writable.write(jsonData);
        await writable.close();
        
        console.log('Initial data saved to new file');
        
        // Update the last save time
        lastSaveTimeRef.current = Date.now();
        
        // Update the last saved data reference
        lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
        
        // Reset the unsaved changes flag
        hasUnsavedChangesRef.current = false;
        
        // Update the UI
        const timeString = new Date().toLocaleTimeString();
        onLastAutoSaveTimeUpdate(timeString);
        
        // Show a success message
        setAutoSaveStatus('Saved and auto-save enabled');
        setShowAutoSaveStatus(true);
        setTimeout(() => setShowAutoSaveStatus(false), 3000);
        
        setIsSaving(false);
        return true;
      }
    } catch (error) {
      console.error('Error in handleSaveProgress:', error);
      setIsSaving(false);
      return false;
    }
  };

  // Handle loading progress from a file
  const handleLoadProgress = async (
    e: React.ChangeEvent<HTMLInputElement>,
    options?: { loadStudents: boolean; loadFeedback: boolean }
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Default to loading both if no options provided
    const loadOptions = {
      loadStudents: true,
      loadFeedback: true,
      ...options
    };

    // Check if this is a JSON file (previously saved progress)
    const isProgressFile = file.name.endsWith('.json');
    
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        
        // If it's a JSON file, parse it as a progress file
        if (isProgressFile) {
          const data = JSON.parse(content) as SaveData;
          
          // Selectively load students and feedback based on options
          if (loadOptions.loadStudents) {
            setStudents(data.students);
            setAssignmentName(data.assignmentName);
          }
          
          if (loadOptions.loadFeedback && Array.isArray(data.feedbackItems) && data.feedbackItems.length > 0) {
            setFeedbackItems(data.feedbackItems);
          }
          
          // Update last saved data reference
          lastSavedDataRef.current = JSON.stringify({ 
            students: loadOptions.loadStudents ? data.students : students,
            feedbackItems: loadOptions.loadFeedback ? data.feedbackItems : feedbackItems
          });
          console.log('Setting lastSavedDataRef from loaded file');
          
          // Reset unsaved changes flag
          hasUnsavedChangesRef.current = false;
          
          // Track the import
          onChangeTracked({
            type: 'import',
            studentName: 'System',
            timestamp: new Date().toISOString(),
            message: `Progress data imported (${loadOptions.loadStudents ? 'students' : ''}${loadOptions.loadStudents && loadOptions.loadFeedback ? ' and ' : ''}${loadOptions.loadFeedback ? 'feedback' : ''})`,
            oldValue: '',
            newValue: ''
          });
          
          // Store the file content for later use
          sessionStorage.setItem('loadedFileContent', content);
          sessionStorage.setItem('loadedFileName', file.name);
          
          // Automatically try to enable auto-save
          try {
            await createNewFileHandle();
          } catch (err) {
            console.error('Failed to automatically enable auto-save:', err);
            // Show a message that auto-save couldn't be enabled
            setAutoSaveStatus('Auto-save could not be enabled automatically. Use "Save Progress" to save your work.');
            setShowAutoSaveStatus(true);
            setTimeout(() => {
              setShowAutoSaveStatus(false);
            }, 5000);
          }
        } else {
          // This is a CSV import from Moodle, not a progress file
          // Don't prompt for auto-save yet - wait for the user to manually save first
          setAutoSaveStatus('New data imported. Use "Save Progress" to save your work.');
          setShowAutoSaveStatus(true);
          setTimeout(() => {
            setShowAutoSaveStatus(false);
          }, 5000);
        }
      } catch (error) {
        console.error('Error parsing file:', error);
        setError("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  // Update the handleEnableAutoSave function
  const handleEnableAutoSave = async () => {
    try {
      const fileName = sessionStorage.getItem('loadedFileName') || "your_progress.json";
      const content = sessionStorage.getItem('loadedFileContent');
      
      if (!content) {
        setError("Could not retrieve file content. Please try loading the file again.");
        return;
      }
      
      const options = {
        suggestedName: fileName,
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      };
      
      // Show the save picker to get a file handle
      const handle = await window.showSaveFilePicker(options);
      
      // Set the file handle in the component state
      setFileHandle(handle);
      
      // Store the file handle for future sessions
      await storeFileHandle(handle);
      
      // IMPORTANT: Pass the file handle back to the parent component
      onFileHandleCreated(handle);
      
      console.log('File handle created and passed to parent:', handle);
      
      // Save the file immediately to the selected location
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      
      // Update the last save time
      lastSaveTimeRef.current = Date.now();
      
      // Update the last saved data reference with the current data
      lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
      
      // Reset the unsaved changes flag
      hasUnsavedChangesRef.current = false;
      
      // Format current time for display
      const timeString = new Date().toLocaleTimeString();
      onLastAutoSaveTimeUpdate(timeString);
      
      setAutoSaveStatus('Auto-save enabled');
      setShowAutoSaveStatus(true);
      setTimeout(() => {
        setShowAutoSaveStatus(false);
      }, 3000);
      
      // Clear the session storage
      sessionStorage.removeItem('loadedFileContent');
      sessionStorage.removeItem('loadedFileName');
      
      // Reset the flag
      setFileLoadedNoAutoSave(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('User cancelled the save dialog');
        setAutoSaveStatus('Auto-save not enabled (no file location selected)');
        setShowAutoSaveStatus(true);
        setTimeout(() => {
          setShowAutoSaveStatus(false);
        }, 5000);
      } else {
        console.error('Error setting up auto-save:', err);
        setError('Failed to enable auto-save. You will need to save manually.');
      }
    }
  };

  // Add this function to create a new file handle
  const createNewFileHandle = async () => {
    try {
      console.log('Creating new file handle...');
      
      // Show the file picker to get a new file handle
      const handle = await window.showSaveFilePicker({
        suggestedName: "grading_progress.json",
        types: [{
          description: 'JSON Files',
          accept: { 'application/json': ['.json'] },
        }],
      });
      
      console.log('New file handle created:', handle);
      
      // Set the file handle in the component state
      setFileHandle(handle);
      
      // Pass the file handle to the parent component
      onFileHandleCreated(handle);
      
      // Save the current data to the file
      const data = {
        students,
        feedbackItems,
        assignmentName,
        timestamp: new Date().toISOString()
      };
      
      const jsonData = JSON.stringify(data, null, 2);
      
      const writable = await handle.createWritable();
      await writable.write(jsonData);
      await writable.close();
      
      console.log('Initial data saved to new file');
      
      // Update the last save time
      lastSaveTimeRef.current = Date.now();
      
      // Update the last saved data reference
      lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
      
      // Reset the unsaved changes flag
      hasUnsavedChangesRef.current = false;
      
      // Update the UI
      const timeString = new Date().toLocaleTimeString();
      onLastAutoSaveTimeUpdate(timeString);
      
      // Show a success message
      setAutoSaveStatus('Auto-save enabled');
      setShowAutoSaveStatus(true);
      setTimeout(() => setShowAutoSaveStatus(false), 3000);
      
      return true;
    } catch (err) {
      console.error('Error creating new file handle:', err);
      return false;
    }
  };

  // Add this function to check if all students have grades and feedback
  const isGradingComplete = () => {
    return students.every(student => {
      const hasGrade = student.grade && student.grade.trim() !== '';
      const hasFeedback = student.feedback && student.feedback.trim() !== '';
      return hasGrade && hasFeedback;
    });
  };

  const handleSubmit = () => {
    if (!isGradingComplete()) {
      alert('Please complete all grades and feedback before submitting.');
      return;
    }
    
    // Save progress first
    handleSaveProgress().then((success) => {
      if (success) {
        // Close the current window/tab
        window.close();
      } else {
        alert('Please save your changes before submitting.');
      }
    });
  };

  return (
    <div className="layout">
      <div className="listSection">
        <FileControls
          onFileImport={handleFileChange}
          onExport={exportForMoodle}
          onSaveProgress={handleSaveProgress}
          onLoadProgress={handleLoadProgress}
          onSubmit={handleSubmit}
          error={error}
          autoSaveStatus={autoSaveStatus}
          showAutoSaveStatus={showAutoSaveStatus}
          hasData={students.length > 0}
          isGradingComplete={isGradingComplete()}
          isSaving={isSaving}
          fileHandle={fileHandle || undefined}
          isNewImport={isNewImport}
          fileLoadedNoAutoSave={fileLoadedNoAutoSave}
          onEnableAutoSave={handleEnableAutoSave}
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
                onStudentModified={markChanges}
              />
            </Table>
          </div>
        </div>
      </div>

      {/* Only show debug panel when explicitly enabled with keyboard shortcut */}
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
