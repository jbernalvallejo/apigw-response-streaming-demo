# Requirements Document

## Introduction

This feature creates a demonstration application that showcases the benefits of Amazon API Gateway response streaming (launched Nov 2025). The application deploys a single REST API with two endpoints — one using the traditional buffered transfer mode and one using the new streaming transfer mode — both backed by AWS Lambda functions that invoke Amazon Bedrock's Nova Lite model via ConverseStream. The purpose is to provide a tangible, side-by-side comparison of the user experience difference between buffered and streamed responses for large LLM-generated content. Infrastructure is defined using Terraform.

## Glossary

- **REST_API**: The Amazon API Gateway REST API resource that exposes both the buffered and streaming endpoints
- **Buffer_Endpoint**: The API Gateway route configured with the default BUFFERED transfer mode, backed by the Buffer Lambda function
- **Stream_Endpoint**: The API Gateway route configured with STREAM transfer mode, backed by the Stream Lambda function
- **Buffer_Lambda**: The AWS Lambda function (Node.js) that uses the standard handler pattern to invoke Bedrock ConverseStream, collects the full response, and returns it as a single buffered payload
- **Stream_Lambda**: The AWS Lambda function (Node.js) that uses `awslambda.streamifyResponse` to invoke Bedrock ConverseStream and write response chunks incrementally to the client via response streaming
- **Bedrock_Client**: The AWS SDK client (`@aws-sdk/client-bedrock-runtime`) used to call Amazon Bedrock's ConverseStream API
- **Nova_Lite**: The Amazon Bedrock foundation model (`amazon.nova-lite-v1:0`) used to generate large text responses
- **Terraform_Config**: The Terraform infrastructure-as-code configuration that provisions all AWS resources
- **Demo_Script**: Documentation describing how to run two curl commands side by side to showcase the UX difference

## Requirements

### Requirement 1: REST API Creation

**User Story:** As a developer, I want a single API Gateway REST API deployed, so that I can access both buffered and streaming endpoints under one API.

#### Acceptance Criteria

1. THE Terraform_Config SHALL provision a single Amazon API Gateway REST API resource with a REGIONAL endpoint type
2. THE REST_API SHALL contain exactly two resource paths: one for the Buffer_Endpoint and one for the Stream_Endpoint
3. THE Terraform_Config SHALL deploy the REST_API to a stage accessible via a public invoke URL
4. THE Terraform_Config SHALL use AWS profile "demo" and region "eu-south-2"

### Requirement 2: Buffer Endpoint

**User Story:** As a developer, I want a buffered endpoint that collects the full Bedrock response before returning it, so that I can compare it against the streaming endpoint.

#### Acceptance Criteria

1. THE Buffer_Endpoint SHALL accept HTTP POST requests
2. THE Buffer_Endpoint SHALL use AWS_PROXY integration type with the Buffer_Lambda
3. THE Buffer_Endpoint SHALL use the default BUFFERED transfer mode
4. THE Buffer_Endpoint SHALL use the standard Lambda invocation URI path (`/invocations`)
5. WHEN a request is received, THE Buffer_Lambda SHALL invoke the Bedrock_Client with ConverseStream using the Nova_Lite model
6. WHEN the Bedrock_Client returns the complete streamed response, THE Buffer_Lambda SHALL concatenate all text chunks and return the full response body with HTTP status 200 and Content-Type "text/plain"
7. IF the Bedrock_Client returns an error, THEN THE Buffer_Lambda SHALL return an HTTP 500 response with a descriptive error message

### Requirement 3: Stream Endpoint

**User Story:** As a developer, I want a streaming endpoint that sends Bedrock response chunks to the client as they arrive, so that I can demonstrate the improved time-to-first-byte and progressive rendering.

#### Acceptance Criteria

1. THE Stream_Endpoint SHALL accept HTTP POST requests
2. THE Stream_Endpoint SHALL use AWS_PROXY integration type with the Stream_Lambda
3. THE Stream_Endpoint SHALL use STREAM transfer mode via the `responseTransferMode` property in the `x-amazon-apigateway-integration` OpenAPI extension
4. THE Stream_Endpoint SHALL use the Lambda response-streaming invocation URI path (`/response-streaming-invocations`)
5. THE Stream_Lambda SHALL use `awslambda.streamifyResponse` to wrap the handler function
6. THE Stream_Lambda SHALL use `awslambda.HttpResponseStream.from()` to set HTTP status 200 and Content-Type "text/plain"
7. WHEN a request is received, THE Stream_Lambda SHALL invoke the Bedrock_Client with ConverseStream using the Nova_Lite model
8. WHEN the Bedrock_Client yields a contentBlockDelta event, THE Stream_Lambda SHALL write the delta text chunk to the response stream immediately
9. WHEN the Bedrock_Client stream completes, THE Stream_Lambda SHALL end the response stream
10. IF the Bedrock_Client returns an error during streaming, THEN THE Stream_Lambda SHALL write an error message to the response stream and end the stream

### Requirement 4: Lambda Function Configuration

**User Story:** As a developer, I want both Lambda functions properly configured with the correct runtime, permissions, and settings, so that they can invoke Bedrock and respond to API Gateway.

#### Acceptance Criteria

1. THE Terraform_Config SHALL provision both the Buffer_Lambda and Stream_Lambda using the Node.js 22.x runtime
2. THE Terraform_Config SHALL assign an IAM execution role to each Lambda function with permissions to invoke Amazon Bedrock's `bedrock:InvokeModelWithResponseStream` action for the Nova_Lite model
3. THE Terraform_Config SHALL configure each Lambda function with a timeout of 120 seconds to accommodate large Bedrock responses
4. THE Terraform_Config SHALL grant API Gateway permission to invoke both Lambda functions via `aws_lambda_permission` resources
5. THE Terraform_Config SHALL package each Lambda function's source code from a local directory

### Requirement 5: Shared Bedrock Prompt

**User Story:** As a developer, I want both Lambda functions to use the same prompt that generates a large response, so that the comparison between buffered and streaming modes is fair and meaningful.

#### Acceptance Criteria

1. THE Buffer_Lambda and THE Stream_Lambda SHALL both send the same user prompt text to the Nova_Lite model via ConverseStream
2. THE prompt SHALL request the Nova_Lite model to generate a response of sufficient length to make the streaming benefit observable (at least several paragraphs)
3. THE Bedrock_Client invocation SHALL use model ID "amazon.nova-lite-v1:0"
4. THE Bedrock_Client invocation SHALL set a maxTokens parameter of at least 2048 to allow for a large response

### Requirement 6: No Authentication

**User Story:** As a developer, I want the API to be publicly accessible without authentication, so that I can quickly demo the endpoints with curl without extra setup.

#### Acceptance Criteria

1. THE Buffer_Endpoint SHALL require no API key or authorization header
2. THE Stream_Endpoint SHALL require no API key or authorization header
3. THE REST_API SHALL not have any authorizers attached to either endpoint

### Requirement 7: Terraform Infrastructure

**User Story:** As a developer, I want all infrastructure defined in Terraform, so that I can deploy and tear down the demo environment reproducibly.

#### Acceptance Criteria

1. THE Terraform_Config SHALL define the AWS provider with profile "demo" and region "eu-south-2"
2. THE Terraform_Config SHALL output the full invoke URLs for both the Buffer_Endpoint and the Stream_Endpoint after deployment
3. THE Terraform_Config SHALL define the API structure using an inline OpenAPI specification in the `aws_api_gateway_rest_api` resource's `body` attribute, with `x-amazon-apigateway-integration` extensions that include `responseTransferMode: STREAM` on the streaming endpoint's integration
4. THE Terraform_Config SHALL define all resources necessary for a complete deployment: REST API, Lambda functions, IAM roles, IAM policies, Lambda permissions, and API Gateway deployment and stage

### Requirement 8: Demo Instructions

**User Story:** As a developer, I want clear demo instructions with curl commands, so that I can quickly showcase the UX difference between buffered and streaming responses.

#### Acceptance Criteria

1. THE Demo_Script SHALL include a curl command for the Buffer_Endpoint that shows the full response arriving after a delay
2. THE Demo_Script SHALL include a curl command for the Stream_Endpoint that shows chunks arriving progressively
3. THE Demo_Script SHALL instruct the user to run both curl commands side by side in separate terminal windows
4. THE Demo_Script SHALL reference the Terraform output values for the endpoint URLs
5. THE Demo_Script SHALL include the `--no-buffer` flag on the streaming curl command to disable curl's output buffering
