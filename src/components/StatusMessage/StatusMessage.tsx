import React from 'react';
import './StatusMessage.css';

interface StatusMessageProps {
  message: string;
  type?: 'success' | 'error';
  icon?: string;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  type = 'success',
  icon = '💾'
}) => {
  const isAutoSaveMessage = message.includes('Auto-saved');
  
  if (!message) return null;

  return (
    <div 
      className={`status-bar ${type} ${isAutoSaveMessage ? 'auto-save-message' : ''}`}
    >
      <span className="status-icon">{icon}</span>
      <span className="status-text">{message}</span>
    </div>
  );
};

export default StatusMessage; 