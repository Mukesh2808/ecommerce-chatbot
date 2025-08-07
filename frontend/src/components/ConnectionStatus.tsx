import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkBackendConnection } from '../store/slices/chatSlice';
import './ConnectionStatus.css';

const ConnectionStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const { connectionStatus, error } = useAppSelector(state => state.chat);

  useEffect(() => {
    // Check connection on mount
    dispatch(checkBackendConnection());
    
    // Set up periodic connection checks
    const interval = setInterval(() => {
      dispatch(checkBackendConnection());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`connection-status ${connectionStatus}`}>
      <span className="status-icon">{getStatusIcon()}</span>
      <span className="status-text">{getStatusText()}</span>
      {error && (
        <div className="connection-error" title={error}>
          ⚠️
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
