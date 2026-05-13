'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hi there! I\'m Neon, your personal toy expert. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderMessage = (content: string) => {
    // Clean up cases where the LLM wraps the link in bold asterisks
    const cleanContent = content.replace(/\*\*\[(.*?)\]\((.*?)\)\*\*/g, '[$1]($2)');
    
    // Parse markdown links: [Text](url)
    const parts = cleanContent.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        return <a key={index} href={linkMatch[2]} className="chat-link">{linkMatch[1]}</a>;
      }
      
      // Parse bold text: **text**
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bPart, bIndex) => {
        const boldMatch = bPart.match(/\*\*(.*?)\*\*/);
        if (boldMatch) {
          return <strong key={`${index}-${bIndex}`}>{boldMatch[1]}</strong>;
        }
        return <React.Fragment key={`${index}-${bIndex}`}>{bPart}</React.Fragment>;
      });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      
      const botMessage: Message = { 
        role: 'bot', 
        content: data.content 
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'bot',
        content: "I'm sorry, I'm having trouble connecting to my brain right now. Please check if the GEMINI_API_KEY is set in your environment."
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {/* Floating Button */}
      <button 
        className={`chatbot-fab ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <span className="close-icon">×</span>
        ) : (
          <div className="bot-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="chat-svg">
              <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36093 14.891 4 16.1272L3 21L7.8728 20C9.10904 20.6391 10.5124 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 11H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 11H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="bot-info">
            <div className="bot-status"></div>
            <h2>Neon Assistant</h2>
          </div>
          <button className="minimize-btn" onClick={() => setIsOpen(false)} aria-label="Minimize chat">—</button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-bubble">
                {renderMessage(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message bot loading">
              <div className="message-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="send-btn" onClick={handleSend} disabled={!input.trim()} aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .chatbot-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 9999;
          font-family: inherit;
        }

        .chatbot-fab {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(45deg, var(--accent-pink), var(--accent-cyan));
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 210, 255, 0.4);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .chatbot-fab:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 0 25px rgba(255, 51, 102, 0.5);
        }

        .chatbot-fab.active {
          transform: rotate(90deg);
        }

        .chat-svg {
          width: 30px;
          height: 30px;
        }

        .close-icon {
          font-size: 32px;
          line-height: 1;
        }

        .chatbot-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 380px;
          height: min(550px, calc(100vh - 120px));
          background: var(--bg-gradient-start);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(20px);
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: bottom right;
        }

        .chatbot-window.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        @media (max-width: 480px) {
          .chatbot-window {
            width: calc(100vw - 40px);
            height: calc(100dvh - 240px);
            right: -10px;
          }
        }

        .chat-header {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .bot-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bot-status {
          width: 10px;
          height: 10px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 8px #4ade80;
        }

        .chat-header h2 {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(to right, var(--accent-pink), var(--accent-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .minimize-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 1.2rem;
          min-width: 48px;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
          scrollbar-width: thin;
          scrollbar-color: var(--glass-border) transparent;
        }

        .message {
          max-width: 80%;
          display: flex;
        }

        .message.user {
          align-self: flex-end;
        }

        .message.bot {
          align-self: flex-start;
        }

        .message-bubble {
          padding: 12px 18px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .user .message-bubble {
          background: var(--accent-cyan);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
        }

        .bot .message-bubble {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
          border: 1px solid var(--glass-border);
        }

        .message-bubble :global(.chat-link) {
          color: var(--accent-cyan);
          text-decoration: none;
          font-weight: 600;
          border-bottom: 1px dashed var(--accent-cyan);
          transition: all 0.2s;
        }

        .message-bubble :global(.chat-link:hover) {
          color: var(--accent-pink);
          border-bottom-color: var(--accent-pink);
          text-shadow: 0 0 8px rgba(255, 51, 102, 0.4);
        }

        .chat-input-area {
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border-top: 1px solid var(--glass-border);
          display: flex;
          gap: 10px;
        }

        .chat-input-area input {
          flex: 1;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 12px 15px;
          color: white;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.3s;
        }

        .chat-input-area input:focus {
          border-color: var(--accent-cyan);
        }

        .send-btn {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: linear-gradient(45deg, var(--accent-pink), var(--accent-cyan));
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-btn svg {
          width: 20px;
          height: 20px;
        }

        .loading .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--text-secondary);
          border-radius: 50%;
          margin: 0 2px;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .loading .dot:nth-child(1) { animation-delay: -0.32s; }
        .loading .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
