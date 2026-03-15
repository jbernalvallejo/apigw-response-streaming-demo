# SSE Chatbot Demo

A chatbot that streams responses word-by-word using **Server-Sent Events (SSE)** over Lambda response streaming. The React frontend sends conversation history via POST to API Gateway, which invokes a streaming Lambda that calls Amazon Bedrock Nova Lite (`amazon.nova-lite-v1:0`) via ConverseStream and writes each text chunk back as an SSE event (`data: {"text":"..."}\n\n`).

## Architecture

```
Browser (React)
  └── POST /chat  →  API GW (STREAM)  →  Chat Lambda  →  Bedrock ConverseStream
       ← SSE events: data: {"text":"chunk"}\n\n
       ← data: [DONE]\n\n
```

The frontend uses the Fetch API with `getReader()` to consume SSE from a POST request (native `EventSource` only supports GET). Conversation history is maintained client-side and sent with each request for multi-turn context. The UI includes quick-prompt buttons for getting started and a clear button to reset the conversation.

## Project Structure

```
lambda-sse/
├── frontend/          # React frontend (Vite)
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useChat.js
│   │   ├── lib/
│   │   │   └── sseClient.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── lambda/
│   └── chat/
│       └── index.mjs  # streamifyResponse — SSE-formatted Bedrock chunks
├── terraform/
│   ├── main.tf        # REST API (OpenAPI body), deployment, stage, CORS
│   ├── lambda.tf      # Lambda function, IAM role, permissions, packaging
│   └── outputs.tf     # Chat endpoint URL
└── README.md
```

## Prerequisites

- **AWS CLI** installed and configured with a profile named `demos`
- **Terraform** installed (v1.0+)
- **Node.js** installed (for frontend development)
- **Amazon Bedrock** access to the Nova Lite model (`amazon.nova-lite-v1:0`) enabled in the `eu-west-2` region

## Deploy

From the `lambda-sse/terraform/` directory:

```bash
terraform init
terraform apply
```

After a successful apply, Terraform outputs the endpoint URL:

```
chat_endpoint_url = "https://<api-id>.execute-api.eu-west-2.amazonaws.com/demo/chat"
```

## Test with curl

```bash
curl -X POST --no-buffer \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}' \
  "$(terraform -chdir=lambda-sse/terraform output -raw chat_endpoint_url)"
```

You should see SSE events streaming in:

```
data: {"text":"Hi"}

data: {"text":" there!"}

data: [DONE]
```

## Frontend Development

From the `lambda-sse/frontend/` directory:

```bash
npm install
VITE_API_URL="$(terraform -chdir=lambda-sse/terraform output -raw chat_endpoint_url)" npm run dev
```

This starts the Vite dev server. Open the URL shown in the terminal to use the chatbot.

## Teardown

```bash
terraform -chdir=lambda-sse/terraform destroy
```
