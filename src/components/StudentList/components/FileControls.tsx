import React from 'react';
import StatusMessage from '@/components/StatusMessage/StatusMessage';

interface FileControlsProps {
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onSaveProgress: () => Promise<void>;
  onLoadProgress: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
  autoSaveStatus: string;
  showAutoSaveStatus: boolean;
  hasData: boolean;
}

const FileControls: React.FC<FileControlsProps> = ({ 
  onFileImport, 
  onExport, 
  onSaveProgress,
  onLoadProgress,
  error,
  autoSaveStatus,
  showAutoSaveStatus,
  hasData
}) => {
  return (
    <>
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
          onClick={onSaveProgress}
          disabled={!hasData}
          style={{ opacity: hasData ? 1 : 0.5, cursor: hasData ? 'pointer' : 'not-allowed' }}
        >
          Save Progress
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
      </div>
      
      {/* Keep the new StatusMessage component for messages */}
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
    </>
  );
};

export default FileControls; 