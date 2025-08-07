import React from 'react';
import { Message as MessageType } from './ChatWindow';
import './Message.css';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const formatMessage = (text: string) => {
    // Handle markdown-style formatting
    return text
      .split('\n')
      .map((line, lineIndex) => (
        <span key={lineIndex}>
          {line.split(/(\*\*.*?\*\*|\*.*?\*)/).map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={partIndex}>{part.slice(1, -1)}</em>;
            }
            return part;
          })}
          {lineIndex < text.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUser = message.sender === 'user';

  return (
    <div className={`message-wrapper ${message.sender}`}>
      <div className={`message ${message.sender}`}>
        <div className="message-content">
          {formatMessage(message.message)}
        </div>
        <div className="message-timestamp">
          {formatTime(message.timestamp)}
        </div>
      </div>
      {!isUser && (
        <div className="message-avatar">
          🤖
        </div>
      )}
      {isUser && (
        <div className="message-avatar">
          👤
        </div>
      )}
    </div>
  );
};

export default Message;
