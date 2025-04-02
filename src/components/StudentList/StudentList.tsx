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

// Define the component with inline props type
const StudentList: React.FC<{
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  selectedStudent: string | null;
  onStudentSelect: (student: string) => void;
  assignmentName: string;
  setAssignmentName: React.Dispatch<React.SetStateAction<string>>;
  onChangeTracked: (change: ChangeRecord) => void;
  feedbackItems: any[];
  setFeedbackItems: React.Dispatch<React.SetStateAction<any[]>>;
  onLastAutoSaveTimeUpdate: (time: string) => void;
  selectedFeedbackId: number | null;
  onSaveData: (showStatus: boolean, isAuto: boolean) => Promise<boolean>;
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
  onSaveData
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

  const { handleFileChange, exportForMoodle } = useCSVHandling(
    setStudents, 
    assignmentName, 
    students,
    onChangeTracked
  );

  // Add these new state variables
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [saveHistory] = useState<Array<{
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
      const _currentData = { students, feedbackItems };
      
      // Only mark as having unsaved changes if the data is different from last saved data
      if (JSON.stringify(_currentData) !== lastSavedDataRef.current) {
        hasUnsavedChangesRef.current = true;
        
        // We're removing the indicator here - just silently track changes
        // No more setAutoSaveStatus or setShowAutoSaveStatus
      }
    }
  }, [students, feedbackItems]);

  // Modify the auto-save interval to use onSaveData
  useEffect(() => {
    console.log('Setting up auto-save interval');
    
    // Force auto-save to run exactly every 1 minute (60000 ms)
    const intervalId = setInterval(() => {
      const now = Date.now();
      
      console.log('Auto-save check running with conditions:');
      console.log(`- Has data: ${students.length > 0 || feedbackItems.length > 0}`);
      console.log(`- Has unsaved changes: ${hasUnsavedChangesRef.current}`);
      console.log(`- Time since last save: ${(now - lastSaveTimeRef.current) / 1000}s`);
      
      // Only run auto-save if we have data
      if (students.length > 0 || feedbackItems.length > 0) {
        // Check if it's been at least 1 minute since the last save
        if (now - lastSaveTimeRef.current >= 60000) {
          console.log('🔄 Auto-save triggered!');
          
          // Show saving indicator
          setIsSaving(true);
          
          // Use the saveData function from App.tsx
          onSaveData(true, true)
            .then(success => {
              if (success) {
                console.log('✅ Auto-save completed successfully');
                
                // Update last save time
                lastSaveTimeRef.current = Date.now();
                
                // Update last saved data
                lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
                
                // Reset unsaved changes flag
                hasUnsavedChangesRef.current = false;
                
                // Format current time for display
                const timeString = new Date().toLocaleTimeString();
                setLastAutoSaveTime(timeString);
                
                // Show auto-save status message
                setAutoSaveStatus(`Auto-saved at ${timeString}`);
                setShowAutoSaveStatus(true);
                
                // Hide the message after a few seconds
                setTimeout(() => {
                  setShowAutoSaveStatus(false);
                }, 3000);
              } else {
                console.error('❌ Auto-save failed');
              }
              
              // Reset saving state
              setIsSaving(false);
            })
            .catch(error => {
              console.error('❌ Auto-save failed:', error);
              setIsSaving(false);
            });
        } else {
          console.log(`⏳ Next auto-save in ${((60000 - (now - lastSaveTimeRef.current)) / 1000).toFixed(0)} seconds`);
        }
      } else {
        console.log('❌ Auto-save conditions not met (no data)');
      }
    }, 1000); // Check every second, but only save every minute
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [students, feedbackItems, onSaveData]); // Re-create the interval when these dependencies change

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

  // Modify the handleSaveProgress function to use onSaveData
  const handleSaveProgress = async (autoSave = false): Promise<boolean> => {
    console.log('handleSaveProgress called with autoSave =', autoSave);
    setIsSaving(true);
    
    try {
      const result = await onSaveData(true, autoSave);
      
      if (result) {
        // Update last save time
        lastSaveTimeRef.current = Date.now();
        
        // Update last saved data
        lastSavedDataRef.current = JSON.stringify({ students, feedbackItems });
        
        // Reset unsaved changes flag
        hasUnsavedChangesRef.current = false;
        
        // Format current time for display
        const timeString = new Date().toLocaleTimeString();
        setLastAutoSaveTime(timeString);
      }
      
      setIsSaving(false);
      return result;
    } catch (error) {
      console.error('Error in handleSaveProgress:', error);
      setIsSaving(false);
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
