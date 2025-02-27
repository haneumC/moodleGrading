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
  const formatMessage = (message: string | undefined): React.ReactNode => {
    if (!message) return null;
    
    const match = message.match(/^(.*?): (\d+) → (\d+) points$/);
    if (match) {
      const [, studentName, oldPoints, newPoints] = match;
      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-200">{studentName}:</span>
          <span className="text-gray-400">{oldPoints} → {newPoints} points</span>
        </div>
      );
    }
    return <span className="text-gray-200">{message}</span>;
  };

  return (
    <div className="w-80 bg-[#1e1e1e] rounded-lg shadow-lg overflow-hidden border border-gray-700">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h3 className="text-gray-200 font-medium">Recent Changes</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {changeHistory.length === 0 ? (
          <div className="p-4 text-gray-400 text-center">No changes yet</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {changeHistory.map((change, index) => (
              <div key={index} className="p-4 hover:bg-[#2d2d2d] transition-colors">
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
                      className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 bg-[#2d2d2d] hover:bg-[#363636] rounded transition-colors"
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