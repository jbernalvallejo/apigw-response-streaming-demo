# Requirements Document

## Introduction

A chatbot demo that showcases Server-Sent Events (SSE) using AWS Lambda as the backend with API Gateway response streaming. End users interact with a React web application to send messages and receive streamed responses from Amazon Bedrock Nova Lite. The browser sends POST requests to API Gateway, which invokes a streaming Lambda that calls Bedrock ConverseStream and writes SSE-formatted events back through the response stream. This demo illustrates the full SSE flow: browser → API Gateway → Lambda → Bedrock and back.

## Glossary

- **Chat_Lambda**: The AWS Lambda function that receives user messages via POST, invokes Bedrock ConverseStream, and writes SSE-formatted events to the response stream using `awslambda.streamifyResponse` and `HttpResponseStream`.
- **REST_API**: The Amazon API Gateway REST API that routes POST /chat requests to the Chat_Lambda with `responseTransferMode: STREAM` enabled via an inline OpenAPI body definition.
- **Frontend**: The React single-page application (built with Vite) that provides the chatbot user interface, sends user messages as POST requests, and consumes SSE responses using the Fetch API with a readable stream.
- **SSE_Event**: A Server-Sent Event formatted as `data: <JSON payload>\n\n`, used to deliver individual text chunks from Bedrock to the Frontend.
- **Conversation_History**: The ordered list of previous user and assistant messages maintained by the Frontend and sent with each request to provide multi-turn context to Bedrock.

## Requirements

### Requirement 1: Stream Chat Responses via SSE

**User Story:** As an end user, I want to see the chatbot's response appear progressively word-by-word, so that I get immediate feedback without waiting for the full response.

#### Acceptance Criteria

1. WHEN the REST_API receives a POST request to `/chat` with a JSON body containing a `messages` array, THE REST_API SHALL route the request to the Chat_Lambda with response streaming enabled.
2. WHEN the Chat_Lambda receives a valid request, THE Chat_Lambda SHALL invoke Bedrock ConverseStream with the `amazon.nova-lite-v1:0` model and the provided messages.
3. WHEN Bedrock returns a content block delta, THE Chat_Lambda SHALL write an SSE_Event containing the text chunk in the format `data: <JSON>\n\n` to the response stream.
4. WHEN the Bedrock stream completes, THE Chat_Lambda SHALL write a final SSE_Event with `data: [DONE]\n\n` and close the response stream.
5. THE Chat_Lambda SHALL set the response `Content-Type` header to `text/event-stream`.

### Requirement 2: React Chatbot Frontend

**User Story:** As an end user, I want a web-based chat interface, so that I can type messages and see streamed responses in a familiar chat layout.

#### Acceptance Criteria

1. THE Frontend SHALL display a message input field and a send button.
2. WHEN the user submits a message, THE Frontend SHALL send a POST request to the `/chat` endpoint with the Conversation_History including the new message.
3. WHEN the Frontend receives SSE_Events from the response stream, THE Frontend SHALL append each text chunk to the current assistant message in real time.
4. THE Frontend SHALL render assistant message content as Markdown, supporting headings, lists, code blocks, bold, italic, and links.
5. WHILE the assistant response is streaming, THE Frontend SHALL display a visual indicator that the response is in progress.
6. WHILE the assistant response is streaming, THE Frontend SHALL disable the message input to prevent concurrent requests.
7. WHEN the Frontend receives the `[DONE]` SSE_Event, THE Frontend SHALL mark the response as complete and re-enable the message input.
8. THE Frontend SHALL display a "Clear" button that resets the Conversation_History and clears the chat display. The button SHALL be disabled while streaming.
9. WHEN the conversation is empty, THE Frontend SHALL display a set of quick-prompt buttons with predefined example messages. Clicking a quick prompt SHALL send that message immediately.

### Requirement 3: Consume SSE from POST Requests

**User Story:** As a developer, I want the frontend to consume SSE responses from POST requests using the Fetch API, so that the chatbot works without the GET-only limitation of the native EventSource API.

#### Acceptance Criteria

1. THE Frontend SHALL use the Fetch API with a readable stream to consume SSE responses from POST requests to the `/chat` endpoint.
2. WHEN the fetch response is received, THE Frontend SHALL read the response body as a stream using `getReader()` and parse incoming chunks for SSE_Event boundaries (`data: ...\n\n`).
3. IF the fetch request fails or the response status is not 200, THEN THE Frontend SHALL display an error message to the user and re-enable the message input.

### Requirement 4: Multi-Turn Conversation Support

**User Story:** As an end user, I want the chatbot to remember previous messages in the conversation, so that I can have a coherent multi-turn dialogue.

#### Acceptance Criteria

1. THE Frontend SHALL maintain a Conversation_History containing all user and assistant messages from the current session.
2. WHEN the user submits a new message, THE Frontend SHALL include the full Conversation_History in the POST request body.
3. THE Chat_Lambda SHALL pass the complete messages array from the request body to the Bedrock ConverseStream API call.

### Requirement 5: CORS Support

**User Story:** As a developer, I want the API Gateway to support CORS, so that the React frontend served from a different origin can communicate with the backend.

#### Acceptance Criteria

1. WHEN the REST_API receives an OPTIONS request to `/chat`, THE REST_API SHALL respond with appropriate CORS headers including `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers`.
2. THE Chat_Lambda SHALL include `Access-Control-Allow-Origin: *` in all response headers.

### Requirement 6: Error Handling

**User Story:** As an end user, I want to see meaningful error messages when something goes wrong, so that I understand what happened and can try again.

#### Acceptance Criteria

1. IF the Chat_Lambda fails to invoke Bedrock, THEN THE Chat_Lambda SHALL write an SSE_Event containing the error message and close the response stream.
2. IF the request body is missing the `messages` array or the array is empty, THEN THE Chat_Lambda SHALL return a 400 status code with a descriptive error message.
3. IF a network error occurs during streaming, THEN THE Frontend SHALL display an error message and re-enable the message input.

### Requirement 7: Infrastructure as Code

**User Story:** As a developer, I want the entire backend infrastructure defined in Terraform, so that I can deploy and tear down the demo with a single command.

#### Acceptance Criteria

1. THE Terraform configuration SHALL define the REST_API using an inline OpenAPI body with a POST `/chat` path configured for streaming integration (`responseTransferMode: STREAM`).
2. THE Terraform configuration SHALL define the Chat_Lambda with Node.js 22.x runtime, a 120-second timeout, and an IAM role with permissions to invoke `bedrock:InvokeModelWithResponseStream`.
3. THE Terraform configuration SHALL package the Chat_Lambda source directory into a zip using the `archive_file` data source.
4. THE Terraform configuration SHALL use the AWS provider with region `eu-south-2` and profile `demo`.
5. THE Terraform configuration SHALL output the chat endpoint URL.
6. THE Terraform configuration SHALL define an OPTIONS method on `/chat` for CORS preflight handling.

### Requirement 8: Frontend Build and Development Setup

**User Story:** As a developer, I want a standard Vite + React setup for the frontend, so that I can develop locally and build for production.

#### Acceptance Criteria

1. THE Frontend SHALL be a Vite + React application located in the `lambda-sse/frontend/` directory.
2. THE Frontend SHALL read the API endpoint URL from an environment variable (`VITE_API_URL`) to support both local development and production deployments.
3. THE Frontend SHALL produce a static build output suitable for hosting on any static file server.
