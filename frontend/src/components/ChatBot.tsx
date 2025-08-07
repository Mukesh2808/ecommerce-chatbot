import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatBot.css';

interface Message {
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: string;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => 
    `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load conversation history
    loadConversationHistory();
    
    // Add welcome message
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        sender: 'bot',
        message: '👋 Hi! I\'m your e-commerce assistant. I can help you with:\n\n' +
                '• Finding top-selling products\n' +
                '• Checking order status\n' +
                '• Product stock information\n' +
                '• Product searches\n\n' +
                'What can I help you with today?',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const loadConversationHistory = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/chat/history/${sessionId}`);
        if (response.data.messages && response.data.messages.length > 0) {
        setMessages(response.data.messages);
        }
    } catch (error) {
        console.error('Error loading conversation history:', error);
    }
    };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      sender: 'user',
      message: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post<ChatResponse>(`${API_BASE_URL}/api/chat`, {
        message: input.trim(),
        sessionId: sessionId
      });

      const botMessage: Message = {
        sender: 'bot',
        message: response.data.response,
        timestamp: response.data.timestamp
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        sender: 'bot',
        message: '❌ Sorry, I encountered an error. Please check your connection and try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = async () => {
    try {
        await axios.delete(`${API_BASE_URL}/api/chat/clear/${sessionId}`);
        setMessages([{
        sender: 'bot',
        message: '🔄 Chat cleared! How can I help you today?',
        timestamp: new Date().toISOString()
        }]);
    } catch (error) {
        console.error('Error clearing chat:', error);
    }
    };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (message: string) => {
    // Simple formatting for bold text and line breaks
    return message
      .split('\n')
      .map((line, index) => (
        <span key={index}>
          {line.split(/(\*\*.*?\*\*)/).map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          {index < message.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h2>🛍️ E-commerce Assistant</h2>
        <button onClick={clearChat} className="clear-btn" title="Clear chat">
          🗑️
        </button>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">
              {formatMessage(msg.message)}
            </div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot">
            <div className="message-content loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about products, orders, or stock..."
            disabled={isLoading}
            maxLength={500}
          />
          <button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            className="send-btn"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
        
        <div className="quick-actions">
          <button onClick={() => setInput('Show me the top 5 most sold products')}>
            Top Products
          </button>
          <button onClick={() => setInput('Check order status 12345')}>
            Order Status
          </button>
          <button onClick={() => setInput('How many Classic T-Shirts are in stock?')}>
            Stock Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
