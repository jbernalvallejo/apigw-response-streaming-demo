import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../lib/sseClient.js';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * React hook that manages conversation state and orchestrates streaming.
 * @returns {{
 *   messages: Array<{ role: string, content: string }>,
 *   isStreaming: boolean,
 *   error: string | null,
 *   sendMessage: (text: string) => void
 * }}
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const isStreamingRef = useRef(false);

  const sendMessage = useCallback((text) => {
    if (isStreamingRef.current) return;

    setError(null);

    const userMessage = { role: 'user', content: text };
    const assistantMessage = { role: 'assistant', content: '' };

    // Messages to send to the API — full history + new user message (no empty assistant)
    const messagesForApi = [...messages, userMessage];

    // Update UI state — includes the empty assistant placeholder
    setMessages([...messages, userMessage, assistantMessage]);

    isStreamingRef.current = true;
    setIsStreaming(true);

    streamChat(API_URL, messagesForApi, {
      onChunk: (chunk) => {
        setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      },
      onDone: () => {
        isStreamingRef.current = false;
        setIsStreaming(false);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        isStreamingRef.current = false;
        setIsStreaming(false);
      },
    });
  }, [messages]);

  const clearMessages = useCallback(() => {
    if (isStreamingRef.current) return;
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}
