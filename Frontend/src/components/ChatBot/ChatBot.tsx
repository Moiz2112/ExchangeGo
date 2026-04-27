import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatBot.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  history: Message[];
  disclaimer: string;
  success: boolean;
  error?: string;
}

// Formats assistant reply into bullet points where applicable
const formatMessage = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  if (lines.length <= 2) return <p className={styles.msgText}>{text}</p>;

  return (
    <ul className={styles.bulletList}>
      {lines.map((line, i) => {
        const clean = line.replace(/^[\*\-\d\.]+\s*/, '').trim();
        return clean ? <li key={i}>{clean}</li> : null;
      })}
    </ul>
  );
};

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setError(null);
    const userMessage = input.trim();
    setInput('');

    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data: ChatResponse = await response.json();
      if (data.success) {
        setMessages(data.history || newMessages);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setError(null);
    setInput('');
  };

  return (
    <div className={styles.chatbotContainer} ref={chatWindowRef}>

      {/* Toggle Button */}
      <button
        className={`${styles.chatButton} ${isOpen ? styles.chatButtonActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Open ChatBot"
      >
        <img
          src="/chatbot-icon.png"
          alt="Chat"
          className={styles.chatButtonIcon}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const span = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
            if (span) span.style.display = 'flex';
          }}
        />
        <span className={styles.chatButtonFallback}>💬</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>

          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerAvatar}>
                <img
                  src="/chatbot-icon.png"
                  alt="Bot"
                  className={styles.headerAvatarImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className={styles.headerTitle}>ExchangeGO Assistant</div>
                <div className={styles.headerSubtitle}>
                  <span className={styles.onlineDot}></span> Online
                </div>
              </div>
            </div>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Disclaimer */}
          <div className={styles.disclaimer}>
            ⚠️ <strong>AI Disclaimer:</strong> Analysis based on historical data. NOT 100% accurate.
          </div>

          {/* Messages */}
          <div className={styles.messagesContainer}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🤖</div>
                <p className={styles.emptyTitle}>How can I help you?</p>
                <p className={styles.emptySubtitle}>Ask me about crypto exchanges, prices & trends</p>
                <div className={styles.exampleChips}>
                  {[
                    "Best BTC prices?",
                    "Compare ETH exchanges",
                    "Top coins on Binance",
                    "Altcoin trends"
                  ].map((q, i) => (
                    <button key={i} className={styles.chip} onClick={() => setInput(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.messageRow} ${styles[msg.role]}`}>
                {msg.role === 'assistant' && (
                  <div className={styles.avatarSmall}>🤖</div>
                )}
                <div className={`${styles.bubble} ${styles[`bubble_${msg.role}`]}`}>
                  {msg.role === 'assistant'
                    ? formatMessage(msg.content)
                    : <p className={styles.msgText}>{msg.content}</p>
                  }
                </div>
              </div>
            ))}

            {loading && (
              <div className={`${styles.messageRow} ${styles.assistant}`}>
                <div className={styles.avatarSmall}>🤖</div>
                <div className={`${styles.bubble} ${styles.bubble_assistant}`}>
                  <div className={styles.loadingDots}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>❌ {error}</div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={styles.inputArea}>
            <form onSubmit={sendMessage} className={styles.form}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about exchanges, coins, trends..."
                disabled={loading}
                className={styles.input}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={styles.sendButton}
              >
                ➤
              </button>
            </form>
            {messages.length > 0 && (
              <button onClick={resetChat} className={styles.resetButton}>
                🔄 Reset Chat
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default ChatBot;