# Tech Stack

## Infrastructure
- Terraform (v1.0+) with the AWS provider (~> 5.0)
- AWS region: `eu-south-2`
- AWS CLI profile: `demo`

## Runtime
- Node.js 22.x (Lambda runtime `nodejs22.x`)
- ES Modules (`.mjs` files, `import`/`export` syntax)
- AWS SDK v3 (`@aws-sdk/client-bedrock-runtime`)

## AWS Services
- Amazon API Gateway (REST API, defined via inline OpenAPI body)
- AWS Lambda (two functions: buffer and stream)
- Amazon Bedrock (Nova Lite model `amazon.nova-lite-v1:0`, ConverseStream API)

## Key Patterns
- Streaming Lambda uses `awslambda.streamifyResponse` with `HttpResponseStream`
- Buffer Lambda uses standard async handler returning a response object
- REST API uses OpenAPI body definition to support `responseTransferMode: STREAM`
- Shared IAM role across both Lambda functions
- Lambda packages built via `archive_file` data source (zip from source dir)

## Common Commands

All Terraform commands run from the `terraform/` directory.

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
