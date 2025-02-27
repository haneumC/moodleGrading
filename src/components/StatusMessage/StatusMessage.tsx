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
  if (!message) return null;

  return (
    <div className={`status-bar ${type}`}>
      <span className="status-icon">{icon}</span>
      {message}
    </div>
  );
};

export default StatusMessage; 