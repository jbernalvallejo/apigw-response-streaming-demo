# Tech Stack

## Infrastructure
- Terraform (v1.0+) with the AWS provider (~> 5.0)
- AWS region: `eu-west-2` (London)
- AWS CLI profile: `demos`

## Runtime
- Node.js 22.x (Lambda runtime `nodejs22.x`)
- ES Modules (`.mjs` files, `import`/`export` syntax)
- AWS SDK v3 (`@aws-sdk/client-bedrock-runtime`)

## AWS Services
- Amazon API Gateway (REST API, defined via inline OpenAPI body)
- AWS Lambda (streaming and buffered functions)
- Amazon Bedrock (Nova Lite model `amazon.nova-lite-v1:0`, ConverseStream API)

## Frontend (lambda-sse only)
- Vite + React 18
- `react-markdown` for rendering assistant responses
- `motion` (Framer Motion) for animations
- Fetch API with `getReader()` for SSE consumption from POST requests
- Google Fonts: Fraunces (serif display) + DM Sans (body)
- CSS custom properties for light/dark theming

## Key Patterns
- Streaming Lambda uses `awslambda.streamifyResponse` with `HttpResponseStream`
- Buffer Lambda uses standard async handler returning a response object
- REST API uses OpenAPI body definition to support `responseTransferMode: STREAM`
- Shared IAM role across both Lambda functions
- Lambda packages built via `archive_file` data source (zip from source dir)

## Common Commands

All Terraform commands run from the demo's `terraform/` directory (e.g. `lambda-streaming/terraform/`).

```bash
# Initialize providers
terraform init

# Deploy
terraform apply

# Destroy
terraform destroy

# Test buffered endpoint
curl -X POST "$(terraform output -raw buffer_endpoint_url)"

# Test streaming endpoint
curl -X POST --no-buffer "$(terraform output -raw stream_endpoint_url)"
```
