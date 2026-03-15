# API Gateway Response Streaming Demo

A side-by-side comparison of Amazon API Gateway's **buffered** vs **streaming** response modes, both backed by Lambda functions invoking Amazon Bedrock Nova Lite via ConverseStream.

The buffered endpoint collects the entire LLM response before returning it as a single payload. The streaming endpoint writes each chunk to the client as it arrives, demonstrating improved time-to-first-byte and progressive rendering.

## Architecture

```
Client (curl)
  ├── POST /buffer  →  API GW (BUFFERED)  →  Buffer Lambda  →  Bedrock ConverseStream
  └── POST /stream  →  API GW (STREAM)    →  Stream Lambda  →  Bedrock ConverseStream
```

Both Lambda functions send the same prompt and use the same model — the only difference is how the response is delivered to the client.

## Project Structure

```
lambda-streaming/
├── terraform/
│   ├── main.tf        # REST API, resources, methods, integrations, deployment, stage
│   ├── lambda.tf      # Lambda functions, shared IAM role, permissions
│   └── outputs.tf     # Endpoint URLs
└── lambda/
    ├── buffer/
    │   └── index.mjs  # Standard handler — collects full response, returns once
    └── stream/
        └── index.mjs  # streamifyResponse — writes chunks as they arrive
```

## Prerequisites

- **AWS CLI** installed and configured with a profile named `demo`
- **Terraform** installed (v1.0+)
- **Amazon Bedrock** access to the Nova Lite model (`amazon.nova-lite-v1:0`) enabled in the `eu-south-2` region

## Deploy

From the `lambda-streaming/terraform/` directory:

```bash
terraform init
terraform apply
```

After a successful apply, Terraform outputs the endpoint URLs:

```
buffer_endpoint_url = "https://<api-id>.execute-api.eu-south-2.amazonaws.com/demo/buffer"
stream_endpoint_url = "https://<api-id>.execute-api.eu-south-2.amazonaws.com/demo/stream"
```

## Run the Demo

Open two terminal windows side by side and run the commands simultaneously to see the difference.

**Terminal 1 — Buffered response** (waits for the full response, then prints it all at once):

```bash
curl -X POST "$(terraform -chdir=lambda-streaming/terraform output -raw buffer_endpoint_url)"
```

**Terminal 2 — Streamed response** (chunks appear progressively as they're generated):

```bash
curl -X POST --no-buffer "$(terraform -chdir=lambda-streaming/terraform output -raw stream_endpoint_url)"
```

The `--no-buffer` flag disables curl's output buffering so you can see each chunk arrive in real time.

You'll notice the streaming terminal starts showing text almost immediately, while the buffered terminal sits idle until the entire response is ready.

## Teardown

```bash
terraform -chdir=lambda-streaming/terraform destroy
```
