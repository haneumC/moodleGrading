import React from 'react';

interface AutoSaveDebugPanelProps {
  isVisible: boolean;
  lastSaveTime: number;
  hasUnsavedChanges: boolean;
  fileHandle: FileSystemFileHandle | null;
  saveHistory: Array<{
    timestamp: number;
    success: boolean;
    dataSize: number;
  }>;
}

const AutoSaveDebugPanel: React.FC<AutoSaveDebugPanelProps> = ({
  isVisible,
  lastSaveTime,
  hasUnsavedChanges,
  fileHandle,
  saveHistory
}) => {
  if (!isVisible) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '300px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #444',
        borderRadius: '4px',
        padding: '10px',
        color: 'white',
        fontSize: '12px',
        zIndex: 1000,
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
        Auto-Save Debug
      </h3>
      <div style={{ marginBottom: '5px' }}>
        <strong>File:</strong> {fileHandle ? fileHandle.name : 'None selected'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Last Save:</strong> {lastSaveTime ? new Date(lastSaveTime).toLocaleTimeString() : 'Never'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Unsaved Changes:</strong> {hasUnsavedChanges ? 'Yes' : 'No'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Next Auto-Save:</strong> {lastSaveTime ? new Date(lastSaveTime + 60000).toLocaleTimeString() : 'N/A'}
      </div>
      
      <h4 style={{ margin: '10px 0 5px 0', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
        Save History
      </h4>
      <div>
        {saveHistory.length === 0 ? (
          <div>No saves recorded yet</div>
        ) : (
          saveHistory.map((save, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '5px',
                padding: '3px',
                backgroundColor: save.success ? '#1e3a29' : '#3a1e1e',
                borderRadius: '2px'
              }}
            >
              {new Date(save.timestamp).toLocaleTimeString()} - 
              {save.success ? 'Success' : 'Failed'} - 
              {(save.dataSize / 1024).toFixed(2)} KB
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AutoSaveDebugPanel; 