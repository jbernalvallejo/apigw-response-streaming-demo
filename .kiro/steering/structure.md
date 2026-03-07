# Project Structure

```
├── terraform/           # All infrastructure-as-code
│   ├── main.tf          # REST API (OpenAPI body), deployment, stage
│   ├── lambda.tf        # Lambda functions, shared IAM role, permissions, packaging
│   └── outputs.tf       # Endpoint URLs
├── lambda/              # Lambda function source code
│   ├── buffer/
│   │   └── index.mjs    # Standard async handler — collects full response, returns once
│   └── stream/
│       └── index.mjs    # streamifyResponse handler — writes chunks progressively
└── README.md
```

## Conventions
- Each Lambda function lives in its own subdirectory under `lambda/`
- Each function has a single `index.mjs` entry point with a named `handler` export
- Terraform zips each Lambda directory from source at plan/apply time (no separate build step)
- Infrastructure and application code are kept in separate top-level directories (`terraform/` vs `lambda/`)
- No `node_modules` or `package.json` — Lambda functions rely solely on the AWS SDK bundled in the Node.js 22.x runtime
