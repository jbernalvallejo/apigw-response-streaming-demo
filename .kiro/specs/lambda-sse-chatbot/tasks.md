# Implementation Plan: Lambda SSE Chatbot

## Overview

Incrementally build the SSE chatbot demo: start with the Lambda handler and SSE formatting, then Terraform infrastructure, then the React frontend with SSE consumption, and finally wire everything together. Each task builds on the previous one, with property-based tests placed close to the code they validate.

## Tasks

- [x] 1. Implement Chat Lambda handler
  - [x] 1.1 Create `lambda-sse/lambda/chat/index.mjs` with the streaming handler
    - Use `awslambda.streamifyResponse` and `HttpResponseStream.from()`
    - Parse `event.body` to extract the `messages` array
    - Validate that `messages` exists and is non-empty; return 400 with descriptive error if not
    - Handle invalid JSON in request body; return 400
    - Map each message's `content` string to Bedrock's `[{ text }]` format
    - Call `BedrockRuntimeClient.send(ConverseStreamCommand)` with `amazon.nova-lite-v1:0`, region `eu-south-2`
    - Set `Content-Type: text/event-stream` and `Access-Control-Allow-Origin: *` headers
    - For each `contentBlockDelta`, write `data: {"text":"<chunk>"}\n\n`
    - On Bedrock error, write `data: {"error":"<message>"}\n\n`
    - Write `data: [DONE]\n\n` and close the stream
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.3, 5.2, 6.1, 6.2_

  - [ ]* 1.2 Write property test for Lambda message mapping to Bedrock format
    - Create `lambda-sse/lambda/chat/__tests__/handler.property.test.mjs`
    - Install `fast-check` and `vitest` as dev dependencies in `lambda-sse/lambda/chat/`
    - **Property 2: Lambda message mapping to Bedrock format**
    - Generate arrays of `{ role, content }` with valid alternating roles and non-empty content
    - Assert all messages present in Bedrock command input, content wrapped in `[{ text }]`, modelId is `amazon.nova-lite-v1:0`
    - **Validates: Requirements 1.2, 4.3**

  - [ ]* 1.3 Write property test for Lambda error SSE formatting
    - Add to `lambda-sse/lambda/chat/__tests__/handler.property.test.mjs`
    - **Property 7: Lambda error SSE formatting**
    - Generate arbitrary error message strings
    - Assert output matches `data: {"error":"<msg>"}\n\n` followed by `data: [DONE]\n\n`
    - **Validates: Requirements 6.1**

  - [ ]* 1.4 Write property test for SSE format round-trip (Lambda side)
    - Create `lambda-sse/lambda/chat/__tests__/sse-format.property.test.mjs`
    - **Property 1: SSE format/parse round-trip**
    - Generate arbitrary non-empty strings including special chars, newlines, unicode
    - Assert `parse(format(text)) === text`
    - **Validates: Requirements 1.3, 3.2**

  - [ ]* 1.5 Write unit tests for Lambda handler validation and SSE output
    - Create `lambda-sse/lambda/chat/__tests__/handler.test.mjs`
    - Test: empty body → 400; missing messages key → 400; empty messages array → 400; invalid JSON → 400
    - Test: correct `Content-Type` header; `[DONE]` sentinel written at end; `Access-Control-Allow-Origin: *` header present
    - _Requirements: 1.5, 5.2, 6.1, 6.2_

- [x] 2. Checkpoint — Lambda handler complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Define Terraform infrastructure
  - [x] 3.1 Create `lambda-sse/terraform/main.tf`
    - AWS provider with region `eu-south-2` and profile `demo`
    - REST API resource with inline OpenAPI body defining:
      - `POST /chat` with streaming Lambda integration (`responseTransferMode: STREAM`, URI uses `/response-streaming-invocations`)
      - `OPTIONS /chat` with mock integration returning CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST,OPTIONS`, `Access-Control-Allow-Headers: Content-Type`)
    - API Gateway deployment with redeployment trigger
    - API Gateway stage named `demo`
    - _Requirements: 7.1, 7.4, 7.6, 5.1_

  - [x] 3.2 Create `lambda-sse/terraform/lambda.tf`
    - IAM role with `sts:AssumeRole` for `lambda.amazonaws.com`
    - IAM policy granting `bedrock:InvokeModelWithResponseStream` on `arn:aws:bedrock:eu-south-2::foundation-model/amazon.nova-lite-v1:0`
    - Attach `AWSLambdaBasicExecutionRole` managed policy
    - `archive_file` data source zipping `../lambda/chat/`
    - Lambda function: `nodejs22.x`, 120s timeout, handler `index.handler`
    - Lambda permission for API Gateway invocation
    - _Requirements: 7.2, 7.3_

  - [x] 3.3 Create `lambda-sse/terraform/outputs.tf`
    - Output the chat endpoint URL (`${stage_invoke_url}/chat`)
    - _Requirements: 7.5_

- [x] 4. Checkpoint — Infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Scaffold Vite + React frontend
  - [x] 5.1 Initialize the frontend project
    - Create `lambda-sse/frontend/` with Vite + React scaffold
    - Set up `package.json` with React, Vite, and dev dependencies (vitest, @testing-library/react, fast-check, jsdom)
    - Create `index.html`, `vite.config.js`, `src/main.jsx`
    - Configure `VITE_API_URL` environment variable usage
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 5.2 Implement SSE client (`lambda-sse/frontend/src/lib/sseClient.js`)
    - Export `streamChat(url, messages, { onChunk, onDone, onError })` function
    - Use `fetch()` with POST method and JSON body
    - Read response body via `response.body.getReader()` and `TextDecoder`
    - Buffer partial lines, split on `\n\n` boundaries
    - Extract payload after `data: ` prefix
    - Call `onChunk` for JSON payloads with `text` field, `onDone` for `[DONE]`
    - Handle non-200 status: read error body, call `onError`
    - Handle network errors (fetch throws): call `onError` with user-friendly message
    - Handle SSE events with `error` field: call `onError` with the error message
    - Skip malformed SSE data, log warning to console
    - _Requirements: 3.1, 3.2, 3.3, 6.3_

  - [ ]* 5.3 Write property test for SSE format/parse round-trip (frontend side)
    - Create `lambda-sse/frontend/src/__tests__/sseClient.property.test.js`
    - **Property 1: SSE format/parse round-trip**
    - Generate arbitrary non-empty strings including special chars, newlines, unicode
    - Assert `parse(format(text)) === text`
    - **Validates: Requirements 1.3, 3.2**

  - [ ]* 5.4 Write property test for frontend error handling on fetch failure
    - Create `lambda-sse/frontend/src/__tests__/errorHandling.property.test.js`
    - **Property 6: Frontend error handling on fetch failure**
    - Generate random non-200 HTTP status codes (4xx, 5xx) and network errors
    - Assert `error` is set in state and `isStreaming` is false
    - **Validates: Requirements 3.3, 6.3**

  - [ ]* 5.5 Write unit tests for SSE client
    - Create `lambda-sse/frontend/src/__tests__/sseClient.test.js`
    - Test: partial chunks across read boundaries; multiple events in a single chunk; empty data fields
    - Test: `[DONE]` handling; error event handling; malformed JSON skipping
    - _Requirements: 3.1, 3.2_

- [x] 6. Implement useChat hook and App component
  - [x] 6.1 Implement `useChat` hook (`lambda-sse/frontend/src/hooks/useChat.js`)
    - Maintain `messages` array, `isStreaming` boolean, `error` state
    - `sendMessage(text)`: append user message, add empty assistant message, call `streamChat()`
    - `onChunk`: update last assistant message content by appending chunk
    - `onDone`: set `isStreaming = false`
    - `onError`: set error state and `isStreaming = false`
    - While `isStreaming` is true, `sendMessage` is a no-op
    - Read API URL from `import.meta.env.VITE_API_URL`
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 4.1, 4.2, 8.2_

  - [ ]* 6.2 Write property tests for useChat hook
    - Create `lambda-sse/frontend/src/__tests__/useChat.property.test.js`
    - **Property 3: Conversation history integrity**
    - Generate sequences of (user message, assistant response) pairs
    - Assert history length = 2N after N exchanges; each POST body = full history + new message
    - **Validates: Requirements 2.2, 4.1, 4.2**

  - [ ]* 6.3 Write property test for chunk concatenation
    - Add to `lambda-sse/frontend/src/__tests__/useChat.property.test.js`
    - **Property 4: Chunk concatenation equals full response**
    - Generate arrays of arbitrary non-empty strings simulating chunks
    - Assert concatenation of chunks = final assistant message content
    - **Validates: Requirements 2.3**

  - [ ]* 6.4 Write property test for input gating during streaming
    - Add to `lambda-sse/frontend/src/__tests__/useChat.property.test.js`
    - **Property 5: Input gating during streaming**
    - Generate arbitrary messages while `isStreaming = true`
    - Assert state unchanged after `sendMessage` call
    - **Validates: Requirements 2.5**

  - [ ]* 6.5 Write unit tests for useChat hook
    - Create `lambda-sse/frontend/src/__tests__/useChat.test.js`
    - Test: `[DONE]` handling sets `isStreaming` to false and re-enables input
    - Test: `VITE_API_URL` is read and used as the fetch URL
    - _Requirements: 2.5, 2.6, 8.2_

  - [x] 6.6 Implement App component (`lambda-sse/frontend/src/App.jsx`)
    - Scrollable message list with role-based styling (user vs assistant)
    - Streaming indicator shown while `isStreaming` is true
    - Text input + send button, disabled while `isStreaming`
    - Error display shown when `error` is non-null
    - Wire up `useChat` hook
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 7. Checkpoint — Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create README and finalize
  - [x] 8.1 Create `lambda-sse/README.md`
    - Describe the demo purpose (SSE chatbot with Lambda streaming + Bedrock)
    - Document directory structure
    - Include deployment instructions (terraform init/apply from `lambda-sse/terraform/`)
    - Include frontend dev instructions (npm install, VITE_API_URL, npm run dev)
    - Include curl test command for the `/chat` endpoint
    - _Requirements: 7.1, 8.1, 8.2_

- [x] 9. Final checkpoint — All components wired and tested
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The Lambda has no `node_modules` — it relies on the AWS SDK bundled in the Node.js 22.x runtime
- The frontend uses Vite + React with `VITE_API_URL` for API endpoint configuration
