terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  profile = "demos"
  region  = "eu-west-2"
}

# --- REST API (defined via OpenAPI body to support responseTransferMode) ---

resource "aws_api_gateway_rest_api" "api" {
  name = "bedrock-streaming-demo"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  body = jsonencode({
    openapi = "3.0.1"
    info = {
      title   = "bedrock-streaming-demo"
      version = "1.0"
    }
    paths = {
      "/buffer" = {
        post = {
          x-amazon-apigateway-integration = {
            type                  = "aws_proxy"
            httpMethod            = "POST"
            uri                   = aws_lambda_function.buffer_lambda.invoke_arn
            passthroughBehavior   = "when_no_match"
          }
        }
      }
      "/stream" = {
        post = {
          x-amazon-apigateway-integration = {
            type                  = "aws_proxy"
            httpMethod            = "POST"
            uri                   = replace(replace(aws_lambda_function.stream_lambda.invoke_arn, "2015-03-31", "2021-11-15"), "/invocations", "/response-streaming-invocations")
            passthroughBehavior   = "when_no_match"
            responseTransferMode  = "STREAM"
          }
        }
      }
    }
  })
}

# --- Deployment & Stage ---

resource "aws_api_gateway_deployment" "deployment" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.api.body))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "demo" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.deployment.id
  stage_name    = "demo"
}
