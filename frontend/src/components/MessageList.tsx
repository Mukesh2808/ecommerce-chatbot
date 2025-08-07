import React, { useEffect, useRef } from 'react';
import Message from './Message';
import { Message as MessageType } from '../store/slices/chatSlice';
import './MessageList.css';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="message-list">
      <div className="messages-container">
        {messages.length === 0 && !isLoading && (
          <div className="empty-chat-state">
            <div className="empty-chat-icon">💬</div>
            <p>No messages yet</p>
            <small>Start a conversation by typing a message below</small>
          </div>
        )}
        
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
          />
        ))}
        
        {isLoading && (
          <div className="message-wrapper bot">
            <div className="message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
