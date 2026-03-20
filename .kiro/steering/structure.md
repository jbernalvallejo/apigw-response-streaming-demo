# Project Structure

```
├── lambda-streaming/          # Response streaming demo (buffered vs streaming)
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── lambda.tf
│   │   └── outputs.tf
│   ├── lambda/
│   │   ├── buffer/
│   │   │   └── index.mjs
│   │   └── stream/
│   │       └── index.mjs
│   └── README.md
├── lambda-sse/                # SSE chatbot demo
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── lambda.tf
│   │   └── outputs.tf
│   ├── lambda/
│   │   └── chat/
│   │       └── index.mjs
│   ├── frontend/              # React frontend (Vite)
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   ├── src/
│   │   │   ├── hooks/useChat.js
│   │   │   ├── lib/sseClient.js
│   │   │   ├── App.css
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   ├── index.html
│   │   ├── package.json
│   │   └── vite.config.js
│   └── README.md
└── README.md
```

## Conventions
- Each demo lives in its own top-level directory (e.g. `lambda-streaming/`, `lambda-sse/`)
- Within each demo, infrastructure and application code are kept in separate directories (`terraform/` vs `lambda/`)
- Each Lambda function lives in its own subdirectory under `lambda/`
- Each function has a single `index.mjs` entry point with a named `handler` export
- Terraform zips each Lambda directory from source at plan/apply time (no separate build step)
- No `node_modules` or `package.json` for Lambda functions — they rely solely on the AWS SDK bundled in the Node.js 22.x runtime
- Frontend projects (e.g. `lambda-sse/frontend/`) have their own `package.json` and use Vite + React
