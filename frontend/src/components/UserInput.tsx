import React, { useState, useRef, KeyboardEvent } from 'react';
import './UserInput.css';

interface UserInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const UserInput: React.FC<UserInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  placeholder = "Type your message..." 
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const quickActions = [
    { label: 'Top Products', query: 'Show me the top 5 most sold products' },
    { label: 'Order Status', query: 'Check order status 12345' },
    { label: 'Stock Check', query: 'How many Classic T-Shirts are in stock?' },
    { label: 'Summer Items', query: 'Show me summer clothing items' }
  ];

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (query: string) => {
    if (!isLoading) {
      onSendMessage(query);
    }
  };

  return (
    <div className="user-input">
      <div className="quick-actions">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="quick-action-btn"
            onClick={() => handleQuickAction(action.query)}
            disabled={isLoading}
          >
            {action.label}
          </button>
        ))}
      </div>
      
      <div className="input-container">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={500}
            className="message-input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="send-button"
            title="Send message"
          >
            {isLoading ? (
              <div className="loading-spinner">⏳</div>
            ) : (
              '📤'
            )}
          </button>
        </div>
        
        <div className="input-info">
          <span className="char-count">
            {input.length}/500
          </span>
          <span className="input-hint">
            Press Enter to send
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserInput;
