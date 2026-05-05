# --- IAM Role for Chat Lambda ---

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "lambda_role" {
  name = "sse-chatbot-demo-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_invoke" {
  name = "bedrock-invoke-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "InvokeNovaInRegion"
        Action   = "bedrock:InvokeModelWithResponseStream"
        Effect   = "Allow"
        Resource = "arn:aws:bedrock:eu-west-2::foundation-model/amazon.nova-lite-v1:0"
      },
      {
        Sid    = "InvokeClaudeGlobalCris"
        Action = "bedrock:InvokeModelWithResponseStream"
        Effect = "Allow"
        Resource = [
          "arn:aws:bedrock:eu-west-2:${data.aws_caller_identity.current.account_id}:inference-profile/global.anthropic.claude-haiku-4-5-20251001-v1:0",
          "arn:aws:bedrock:eu-west-2:${data.aws_caller_identity.current.account_id}:inference-profile/global.anthropic.claude-opus-4-7",
          "arn:aws:bedrock:eu-west-2:${data.aws_caller_identity.current.account_id}:inference-profile/global.anthropic.claude-sonnet-4-6",
        ]
      },
      {
        Sid    = "InvokeClaudeFoundationModels"
        Action = "bedrock:InvokeModelWithResponseStream"
        Effect = "Allow"
        Resource = [
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-opus-4-7",
          "arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-6",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Lambda Packaging ---

data "archive_file" "chat_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/chat"
  output_path = "${path.module}/.build/chat.zip"
}

# --- Lambda Function ---

resource "aws_lambda_function" "chat" {
  function_name    = "sse-chatbot-demo-chat"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  timeout          = 120
  filename         = data.archive_file.chat_lambda_zip.output_path
  source_code_hash = data.archive_file.chat_lambda_zip.output_base64sha256
}

# --- Lambda Permission (allow API Gateway to invoke) ---

resource "aws_lambda_permission" "chat_lambda_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
