# Product Overview

A collection of demo projects showcasing Amazon API Gateway patterns with Amazon Bedrock.

## Lambda Streaming Demo
A side-by-side comparison of API Gateway's buffered vs streaming response modes. Both endpoints invoke the same Amazon Bedrock Nova Lite model via ConverseStream. The buffered endpoint collects the full LLM response before returning it; the streaming endpoint writes chunks to the client as they arrive, demonstrating improved time-to-first-byte.

## SSE Chatbot Demo
An interactive chatbot that streams responses word-by-word using Server-Sent Events (SSE) over Lambda response streaming. A React frontend (Vite) sends conversation history via POST to API Gateway, which invokes a streaming Lambda that calls Bedrock ConverseStream and writes each text chunk back as an SSE event. Assistant messages are rendered as Markdown. The UI features:
- Quick-prompt buttons and conversation clear
- Light/dark theme switcher (persisted to localStorage)
- Shimmer skeleton placeholder while waiting for the first SSE chunk
- Time-to-first-byte (TTFB) badge on each assistant response
- Retry button on failed requests with transparent error display
- SVG favicon

Both are demo/reference projects, not production services. Their purpose is to illustrate API Gateway streaming patterns with Lambda and Bedrock.
