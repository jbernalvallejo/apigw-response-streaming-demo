import { useRef, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { useChat } from './hooks/useChat.js';

export default function App() {
  const { messages, isStreaming, error, sendMessage, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput('');
  };

  const quickPrompts = [
    'Explain Lambda response streaming in 3 sentences',
    'What is Server-Sent Events (SSE)?',
    'Compare REST vs WebSocket vs SSE',
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Lambda SSE Chatbot</h1>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            disabled={isStreaming}
            style={styles.clearButton}
            aria-label="Clear conversation"
          >
            Clear
          </button>
        )}
      </div>

      <div style={styles.messageList}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.empty}>Send a message to start chatting.</p>
            <div style={styles.quickPrompts}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  disabled={isStreaming}
                  style={styles.quickPromptButton}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.messageBubble,
              ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
            }}
          >
            <span style={styles.role}>{msg.role === 'user' ? 'You' : 'Assistant'}</span>
            {msg.role === 'assistant' ? (
              <div style={styles.markdown}>
                <Markdown>{msg.content || '\u00A0'}</Markdown>
              </div>
            ) : (
              <p style={styles.content}>{msg.content || '\u00A0'}</p>
            )}
          </div>
        ))}
        {isStreaming && (
          <p style={styles.streaming}>Thinking…</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={isStreaming}
          style={styles.input}
        />
        <button type="submit" disabled={isStreaming || !input.trim()} style={styles.button}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 24,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 20,
    margin: 0,
    textAlign: 'center',
    flex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
    color: '#555',
    cursor: 'pointer',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 32,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  quickPrompts: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    maxWidth: 400,
  },
  quickPromptButton: {
    padding: '10px 14px',
    fontSize: 13,
    border: '1px solid #ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    color: '#333',
    cursor: 'pointer',
    textAlign: 'left',
  },
  messageBubble: {
    padding: '8px 12px',
    borderRadius: 8,
    maxWidth: '85%',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    minWidth: 0,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0071f3',
    color: '#fff',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    color: '#222',
  },
  role: {
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.7,
    display: 'block',
    marginBottom: 2,
  },
  content: {
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  markdown: {
    margin: 0,
    lineHeight: 1.5,
    overflow: 'auto',
  },
  streaming: {
    color: '#888',
    fontStyle: 'italic',
    margin: '4px 0',
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
    margin: '0 0 8px',
  },
  form: {
    display: 'flex',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ccc',
    borderRadius: 6,
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    fontSize: 14,
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#0071f3',
    color: '#fff',
    cursor: 'pointer',
  },
};
