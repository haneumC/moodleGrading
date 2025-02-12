import React from 'react';

interface FileControlsProps {
  onFileImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  error: string;
}

const FileControls: React.FC<FileControlsProps> = ({ 
  onFileImport, 
  onExport, 
  error 
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
        <button className="studentBtn" onClick={onExport}>
          Export for Moodle
        </button>
        <button className="studentBtn">Save Progress</button>
        <button className="studentBtn">Load Progress</button>
      </div>
      {error && <div className="error-message">{error}</div>}
    </>
  );
};

export default FileControls; 