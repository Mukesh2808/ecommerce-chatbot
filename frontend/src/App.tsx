import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import ChatWindow from './components/ChatWindow';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { createNewSession } from './store/slices/chatSlice';
import './App.css';

const ChatApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentSession, sessions } = useAppSelector(state => state.chat);

  useEffect(() => {
    if (!currentSession) {
      const sessionId = `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      dispatch(createNewSession(sessionId));
    }
  }, [dispatch, currentSession]);

  const handleClearChat = () => {
    console.log('Chat cleared for session:', currentSession?.sessionId);
  };

  if (!currentSession) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">⏳</div>
        <p>Initializing chat...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <ChatWindow 
        sessionId={currentSession.sessionId}
        onClearChat={handleClearChat}
      />
      
      <div className="app-info">
        <span className="session-count">
          Sessions: {sessions.length}
        </span>
      </div>
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ChatApp />
    </Provider>
  );
}

export default App;
