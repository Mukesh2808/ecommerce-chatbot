import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import UserInput from './UserInput';
import './ChatWindow.css';

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

interface ChatWindowProps {
  sessionId: string;
  onClearChat: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId, onClearChat }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
    
    // Add initial welcome message if no history
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        sender: 'bot',
        message: '👋 Welcome to our E-commerce Assistant!\n\n' +
                'I can help you with:\n' +
                '• 🏆 Top-selling products\n' +
                '• 📦 Order status tracking\n' +
                '• 📊 Product stock information\n' +
                '• 🔍 Product searches\n\n' +
                'What can I help you with today?',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [sessionId]);

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}`);
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const formattedMessages = data.messages.map((msg: any, index: number) => ({
          id: `${msg.sender}-${index}-${Date.now()}`,
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.timestamp
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      setError('Failed to load conversation history');
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const botMessage: Message = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        message: data.response,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        sender: 'bot',
        message: '❌ Sorry, I encountered an error. Please check your connection and try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/chat/clear/${sessionId}`, {
        method: 'DELETE'
      });
      
      setMessages([{
        id: 'cleared-' + Date.now(),
        sender: 'bot',
        message: '🔄 Chat cleared! How can I help you today?',
        timestamp: new Date().toISOString()
      }]);
      
      onClearChat();
    } catch (error) {
      console.error('Error clearing chat:', error);
      setError('Failed to clear chat');
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="header-info">
          <h2>🛍️ E-commerce Assistant</h2>
          <span className="session-id">Session: {sessionId.substring(0, 8)}...</span>
        </div>
        <button 
          onClick={handleClearChat} 
          className="clear-button"
          title="Clear conversation"
        >
          🗑️ Clear
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="chat-container" ref={chatContainerRef}>
        <MessageList 
          messages={messages} 
          isLoading={isLoading}
        />
      </div>

      <UserInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Ask about products, orders, or stock..."
      />
    </div>
  );
};

export default ChatWindow;
