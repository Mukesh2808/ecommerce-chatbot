import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCurrentSession, loadConversationHistory } from '../store/slices/chatSlice';
import { toggleSidebar } from '../store/slices/uiSlice';
import './ConversationHistoryPanel.css';

interface ConversationHistoryPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const ConversationHistoryPanel: React.FC<ConversationHistoryPanelProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const dispatch = useAppDispatch();
  const { sessions, currentSession } = useAppSelector(state => state.chat);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter sessions based on search term
  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    
    const lastMessage = session.messages[session.messages.length - 1];
    const firstUserMessage = session.messages.find(msg => msg.sender === 'user');
    
    return (
      session.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastMessage?.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      firstUserMessage?.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort sessions by last activity (most recent first)
  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  const handleSessionClick = async (sessionId: string) => {
    if (sessionId !== currentSession?.sessionId) {
      dispatch(setCurrentSession(sessionId));
      await dispatch(loadConversationHistory(sessionId));
    }
    onClose();
  };

  const getSessionPreview = (session: typeof sessions[0]) => {
    const firstUserMessage = session.messages.find(msg => msg.sender === 'user');
    if (firstUserMessage) {
      return firstUserMessage.message.substring(0, 50) + 
             (firstUserMessage.message.length > 50 ? '...' : '');
    }
    return 'New conversation';
  };

  const getLastActivity = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSessionStats = (session: typeof sessions[0]) => {
    const userMessages = session.messages.filter(msg => msg.sender === 'user').length;
    const botMessages = session.messages.filter(msg => msg.sender === 'bot').length;
    return { userMessages, botMessages, total: session.messages.length };
  };

  return (
    <div className={`conversation-history-panel ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="panel-header">
        <h3>📚 Conversation History</h3>
        <button 
          className="close-panel-btn"
          onClick={onClose}
          title="Close panel"
        >
          ✕
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="sessions-container">
        {sortedSessions.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? (
              <>
                <div className="empty-icon">🔍</div>
                <p>No conversations found matching "{searchTerm}"</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="clear-search-btn"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">💬</div>
                <p>No conversation history yet</p>
                <small>Start chatting to see your conversations here</small>
              </>
            )}
          </div>
        ) : (
          <div className="sessions-list">
            {sortedSessions.map((session) => {
              const isActive = session.sessionId === currentSession?.sessionId;
              const stats = getSessionStats(session);
              
              return (
                <div
                  key={session.sessionId}
                  className={`session-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSessionClick(session.sessionId)}
                >
                  <div className="session-content">
                    <div className="session-header">
                      <div className="session-title">
                        {getSessionPreview(session)}
                      </div>
                      <div className="session-time">
                        {getLastActivity(session.lastActivity)}
                      </div>
                    </div>
                    
                    <div className="session-meta">
                      <div className="session-stats">
                        <span className="stat-item">
                          💬 {stats.total} messages
                        </span>
                        <span className="stat-item">
                          👤 {stats.userMessages}
                        </span>
                        <span className="stat-item">
                          🤖 {stats.botMessages}
                        </span>
                      </div>
                      
                      <div className="session-id">
                        ID: {session.sessionId.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  
                  {isActive && (
                    <div className="active-indicator">
                      ▶️
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel-footer">
        <div className="sessions-summary">
          Total sessions: {sessions.length}
        </div>
      </div>
    </div>
  );
};

export default ConversationHistoryPanel;
