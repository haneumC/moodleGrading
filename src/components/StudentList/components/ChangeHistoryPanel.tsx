import React from 'react';
import { ChangeRecord } from '@/components/StudentList/types';

interface ChangeHistoryPanelProps {
  changeHistory: ChangeRecord[];
  onClose: () => void;
  onRevert: (change: ChangeRecord) => void;
}

const ChangeHistoryPanel: React.FC<ChangeHistoryPanelProps> = ({
  changeHistory,
  onClose,
  onRevert
}) => {
  const formatMessage = (message: string) => {
    // Extract student name and points from message
    const match = message.match(/^(.*?): (\d+) → (\d+) points$/);
    if (match) {
      const [, studentName, oldPoints, newPoints] = match;  // Remove _ and use , to skip first element
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-800">{studentName}:</span>
          <span className="text-gray-600">{oldPoints}</span>
          <span className="text-gray-600">→</span>
          <span className="text-gray-800">{newPoints} points</span>
        </div>
      );
    }
    return <span className="text-gray-800">{message}</span>;
  };

  return (
    <div className="absolute top-28 right-4 w-80 bg-white rounded-lg shadow-lg overflow-hidden border z-50">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-medium text-gray-800">Recent Changes</h3>
        <button 
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center transition-colors"
        >
          <span className="text-gray-800">✕</span>
        </button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {changeHistory.length === 0 ? (
          <div className="p-4 text-gray-500 text-center">No changes yet</div>
        ) : (
          <div className="divide-y">
            {changeHistory.map((change, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">
                        {change.type === 'grade' ? '📊' : '📝'}
                      </span>
                      {formatMessage(change.message)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(change.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {(change.type === 'grade' || change.type === 'feedback') && (
                    <button 
                      onClick={() => onRevert(change)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeHistoryPanel; 