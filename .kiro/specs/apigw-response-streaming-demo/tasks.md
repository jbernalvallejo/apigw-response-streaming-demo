# Implementation Plan: API Gateway Response Streaming Demo

## Overview

Incrementally build a Terraform-managed demo that deploys two API Gateway endpoints (buffered and streaming) backed by Node.js Lambda functions invoking Bedrock Nova Lite via ConverseStream. Each task builds on the previous, ending with full integration and a README.

## Tasks

- [ ] 1. Create Buffer Lambda handler
  - [x] 1.1 Implement `lambda/buffer/index.mjs` with standard Lambda handler
    - Create `BedrockRuntimeClient` for region `eu-south-2`
    - Send `ConverseStreamCommand` with model `amazon.nova-lite-v1:0`, the shared hardcoded prompt, and `maxTokens: 2048`
    - Iterate over the response stream, concatenating all `contentBlockDelta.delta.text` values
    - Return `{ statusCode: 200, headers: { "Content-Type": "text/plain" }, body: <concatenated text> }`
    - On error, return `{ statusCode: 500, headers: { "Content-Type": "text/plain" }, body: "Error generating response: <message>" }`
    - _Requirements: 2.5, 2.6, 2.7, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 1.2 Write unit tests for Buffer Lambda
    - Mock the Bedrock client to return a known sequence of chunks; verify response body, status 200, Content-Type `text/plain`
    - Mock the Bedrock client to throw an error; verify status 500 and descriptive error message
    - Mock the Bedrock client to return zero chunks; verify empty body with status 200
    - _Requirements: 2.5, 2.6, 2.7_

  - [ ]* 1.3 Write property test: Buffer Lambda concatenates all Bedrock chunks
    - **Property 1: Buffer Lambda concatenates all Bedrock chunks**
    - Generate random arrays of text strings as mock Bedrock chunks using fast-check
    - Invoke the handler with a mocked Bedrock client returning those chunks
    - Assert the response body equals the concatenation of all input strings in order
    - **Validates: Requirement 2.6**

  - [ ]* 1.4 Write property test: Buffer Lambda returns 500 on Bedrock error
    - **Property 2: Buffer Lambda returns 500 on Bedrock error**
    - Generate random error messages/types using fast-check
    - Mock the Bedrock client to throw each error
    - Assert the response status is 500 and the body contains an error message
    - **Validates: Requirement 2.7**

- [ ] 2. Create Stream Lambda handler
  - [x] 2.1 Implement `lambda/stream/index.mjs` with `awslambda.streamifyResponse`
    - Create `BedrockRuntimeClient` for region `eu-south-2`
    - Wrap `responseStream` with `awslambda.HttpResponseStream.from()` setting status 200 and `Content-Type: text/plain`
    - Send `ConverseStreamCommand` with model `amazon.nova-lite-v1:0`, the shared hardcoded prompt, and `maxTokens: 2048`
    - For each `contentBlockDelta` event, call `responseStream.write(delta.text)`
    - After the stream completes, call `responseStream.end()`
    - On error, write error message to the stream and call `end()`
    - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write unit tests for Stream Lambda
    - Mock the Bedrock client and response stream; verify each chunk is written in order and `end()` is called
    - Mock the Bedrock client to throw; verify error message is written and `end()` is called
    - Mock the Bedrock client to return zero chunks; verify `end()` is called without writing any chunks
    - _Requirements: 3.7, 3.8, 3.9, 3.10_

  - [ ]* 2.3 Write property test: Stream Lambda writes each chunk and ends the stream
    - **Property 3: Stream Lambda writes each chunk and ends the stream**
    - Generate random arrays of text strings as mock Bedrock chunks using fast-check
    - Invoke the handler with a mocked Bedrock client and a mock response stream
    - Assert each chunk was written in order and `end()` was called exactly once
    - **Validates: Requirements 3.8, 3.9**

  - [ ]* 2.4 Write property test: Stream Lambda writes error and ends stream on failure
    - **Property 4: Stream Lambda writes error and ends stream on failure**
    - Generate random error messages/types using fast-check
    - Mock the Bedrock client to throw each error
    - Assert an error message was written to the stream and `end()` was called
    - **Validates: Requirement 3.10**

- [x] 3. Checkpoint - Verify Lambda handlers and tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Create Terraform infrastructure
  - [x] 4.1 Implement `terraform/main.tf` with provider, REST API (OpenAPI body), deployment, and stage
    - Configure AWS provider with profile `demo` and region `eu-south-2`
    - Create `aws_api_gateway_rest_api` with REGIONAL endpoint type and an inline OpenAPI 3.0.1 `body` attribute
    - Define `/buffer` POST path with `x-amazon-apigateway-integration` (AWS_PROXY, standard `/invocations` URI, no `responseTransferMode`)
    - Define `/stream` POST path with `x-amazon-apigateway-integration` (AWS_PROXY, `/response-streaming-invocations` URI, `responseTransferMode: STREAM`)
    - Create `aws_api_gateway_deployment` triggered by REST API body changes
    - Create `aws_api_gateway_stage` (e.g., `demo`)
    - _Note: OpenAPI body approach used because the Terraform AWS provider does not yet support `response_transfer_mode` natively on `aws_api_gateway_integration`_
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 7.1, 7.3, 7.4_

  - [x] 4.2 Implement `terraform/lambda.tf` with Lambda functions, shared IAM role, and permissions
    - Create a single `aws_iam_role` with Lambda trust policy
    - Attach inline policy granting `bedrock:InvokeModelWithResponseStream` on the Nova Lite model ARN
    - Attach `AWSLambdaBasicExecutionRole` managed policy
    - Create `archive_file` data sources for each Lambda directory
    - Create `aws_lambda_function` for Buffer Lambda and Stream Lambda (Node.js 22.x, 120s timeout, shared role)
    - Create `aws_lambda_permission` for each function allowing API Gateway invocation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.4_

  - [x] 4.3 Implement `terraform/outputs.tf` with endpoint URLs
    - Output `buffer_endpoint_url` with full invoke URL for the buffer endpoint
    - Output `stream_endpoint_url` with full invoke URL for the stream endpoint
    - _Requirements: 7.2_

- [x] 5. Checkpoint - Validate Terraform configuration
  - Run `terraform validate` in the `terraform/` directory to check configuration syntax
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create README with demo instructions
  - [x] 6.1 Write `README.md` with project overview, prerequisites, deployment steps, and demo instructions
    - Include prerequisites: AWS CLI configured with "demo" profile, Terraform installed, Bedrock Nova Lite access in eu-south-2
    - Include deployment steps: `terraform init`, `terraform apply`
    - Include curl command for the buffer endpoint (POST to the output URL)
    - Include curl command for the stream endpoint (POST with `--no-buffer` flag)
    - Instruct user to run both curl commands side by side in separate terminal windows
    - Reference Terraform output values for endpoint URLs
    - Include teardown instructions: `terraform destroy`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Both Lambda functions use the same hardcoded prompt for fair comparison
