# API Gateway Demos

A collection of demo projects showcasing Amazon API Gateway patterns.

## Demos

### [Lambda Streaming](./lambda-streaming/)

A side-by-side comparison of API Gateway's buffered vs streaming response modes, both backed by Lambda functions invoking Amazon Bedrock Nova Lite via ConverseStream.

See the [lambda-streaming README](./lambda-streaming/README.md) for setup and usage instructions.

### [SSE Chatbot](./lambda-sse/)

An interactive chatbot that streams responses word-by-word using Server-Sent Events (SSE) over Lambda response streaming. A React frontend sends conversation history to API Gateway, which invokes a streaming Lambda calling Bedrock ConverseStream and writes SSE-formatted events back to the browser.

See the [lambda-sse README](./lambda-sse/README.md) for setup and usage instructions.
