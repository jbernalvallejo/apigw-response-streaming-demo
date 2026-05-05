# AGENTS.md

Context for AI agents working on this repository.

## Project Overview

A demo project showcasing **Server-Sent Events (SSE) over AWS Lambda response streaming** to stream LLM responses chunk by chunk from Amazon Bedrock.

A React frontend sends conversation history via POST to API Gateway, which invokes a streaming Lambda that calls Bedrock ConverseStream (Nova Lite model) and writes each text chunk as an SSE event.

## Tech Stack

- **Infrastructure**: Terraform (v1.0+) with AWS provider (~> 5.0)
- **Region**: eu-west-2 (London)
- **Runtime**: Node.js 22.x, ES Modules (.mjs)
- **AI Model**: Amazon Bedrock Nova Lite (`amazon.nova-lite-v1:0`), ConverseStream API
- **API**: Amazon API Gateway REST API with inline OpenAPI body, `responseTransferMode: STREAM`
- **Frontend**: Vite + React 18, react-markdown, motion (Framer Motion), Fetch API with getReader()

## Project Structure

```
├── frontend/           # React frontend (Vite)
│   └── src/
│       ├── hooks/useChat.js    # Chat state, TTFB tracking, retry logic
│       ├── lib/sseClient.js    # SSE stream consumer
│       ├── App.jsx             # Main UI component
│       └── App.css             # Theming, layout
├── lambda/
│   └── chat/
│       └── index.mjs           # streamifyResponse — SSE-formatted Bedrock chunks
├── terraform/
│   ├── main.tf                 # REST API (OpenAPI body), deployment, stage, CORS
│   ├── lambda.tf               # Lambda function, IAM role, permissions
│   └── outputs.tf              # Chat endpoint URL
├── .kiro/agents/               # Custom Kiro agents
│   └── code-reviewer.json
└── .github/workflows/          # CI/CD
    └── kiro-code-review.yml
```

## Key Patterns

- Streaming Lambda uses `awslambda.streamifyResponse` with `HttpResponseStream`
- REST API uses OpenAPI body definition to support `responseTransferMode: STREAM`
- Lambda packages built via Terraform `archive_file` data source (zip from source dir)
- No `node_modules` or `package.json` for Lambda — relies solely on the AWS SDK bundled in Node.js 22.x runtime
- Frontend consumes SSE from POST via `fetch()` + `getReader()` (native EventSource only supports GET)
- CORS handled at both Lambda level and via mock OPTIONS integration in API Gateway

## Review Guidelines

This is a **demo/reference project**, not a production service. When reviewing:

- Focus on correctness, security, and clarity over production hardening
- Don't flag missing auth, rate limiting, or WAF — these are intentionally omitted for simplicity
- Do flag: hardcoded secrets, XSS vectors, logic bugs, Terraform misconfigurations, error handling gaps
- The `terraform.tfstate` files are committed intentionally for demo portability (not a real concern here)
