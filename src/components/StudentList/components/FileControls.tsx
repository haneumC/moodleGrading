import React from 'react';
import StatusMessage from '@/components/StatusMessage/StatusMessage';
import './FileControls.css';

interface FileControlsProps {
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onSaveProgress: () => Promise<boolean | void>;
  onLoadProgress: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
  autoSaveStatus: string;
  showAutoSaveStatus: boolean;
  hasData: boolean;
  isSaving: boolean;
  lastAutoSaveTime?: string;
  fileHandle?: FileSystemFileHandle;
  isNewImport: boolean;
  fileLoadedNoAutoSave?: boolean;
  onEnableAutoSave?: () => void;
}

const FileControls: React.FC<FileControlsProps> = ({ 
  onFileImport, 
  onExport, 
  onSaveProgress,
  onLoadProgress,
  error,
  autoSaveStatus,
  showAutoSaveStatus,
  hasData,
  isSaving,
  fileHandle,
  isNewImport,
  fileLoadedNoAutoSave,
  onEnableAutoSave
}) => {
  const handleSaveProgress = async () => {
    console.log('Manual save triggered');
    
    // Show a saving indicator
    const result = await onSaveProgress();
    
    console.log(`Manual save completed with result: ${result ? 'SUCCESS' : 'FAILED'}`);
    
    // If save failed, show an error
    if (!result) {
      alert('Save failed. Check the console for details.');
    } else {
      // If save succeeded, verify the file was updated
      console.log('Verifying file was updated...');
      // Additional verification could be added here
    }
  };

  return (
    <>
      <div className="controls-container">
        <div className="buttons">
          <form>
            <label htmlFor="csvFileInput" className="import-file-label">
              Import File (exported from Moodle)
            </label>
            <input
              type="file"
              id="csvFileInput"
              accept=".csv"
              onChange={onFileImport}
              className="import-file-input"
            />
          </form>
          <button 
            className="studentBtn" 
            onClick={onExport}
            disabled={!hasData}
            style={{ opacity: hasData ? 1 : 0.5, cursor: hasData ? 'pointer' : 'not-allowed' }}
          >
            Export for Moodle
          </button>
          <button 
            className="studentBtn" 
            onClick={handleSaveProgress}
            disabled={!hasData || isSaving}
            style={{ 
              opacity: hasData && !isSaving ? 1 : 0.5, 
              cursor: hasData && !isSaving ? 'pointer' : 'not-allowed',
              position: 'relative'
            }}
          >
            {isSaving ? (
              <>
                <span className="saving-spinner"></span>
                Saving...
              </>
            ) : (
              'Save Progress'
            )}
          </button>
          <label className="studentBtn" style={{ cursor: 'pointer' }}>
            Load Progress
            <input
              type="file"
              accept=".json"
              onChange={onLoadProgress}
              style={{ display: 'none' }}
            />
          </label>
          {fileLoadedNoAutoSave && (
            <button 
              className="studentBtn highlight-btn" 
              onClick={onEnableAutoSave}
            >
              Enable Auto-Save
            </button>
          )}
        </div>
        
        {/* Show different messages based on whether this is a new import or loaded file */}
        {isNewImport && !fileHandle && (
          <div className="import-status">
            <span className="import-dot"></span>
            New data imported. Click "Save Progress" to enable auto-save.
          </div>
        )}
        
        {fileHandle && (
          <div className="auto-save-enabled">
            <span className="auto-save-dot"></span>
            Auto-save enabled
          </div>
        )}
      </div>
      
      {/* Keep the status messages */}
      {error && (
        <StatusMessage 
          message={error} 
          type="error" 
          icon="⚠️"
        />
      )}
      {autoSaveStatus && showAutoSaveStatus && (
        <StatusMessage 
          message={autoSaveStatus} 
          type="success" 
          icon="💾"
        />
      )}
      {autoSaveStatus === 'Please select a location to enable auto-save...' && (
        <StatusMessage 
          message="Please select where to save this file to enable auto-save" 
          type="info" 
          icon="💾"
        />
      )}
    </>
  );
};

export default FileControls; 