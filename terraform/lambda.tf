# --- IAM Role (shared by both Lambda functions) ---

resource "aws_iam_role" "lambda_role" {
  name = "bedrock-streaming-demo-lambda-role"

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
        Action   = "bedrock:InvokeModelWithResponseStream"
        Effect   = "Allow"
        Resource = "arn:aws:bedrock:eu-west-2::foundation-model/amazon.nova-lite-v1:0"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Lambda Packaging ---

data "archive_file" "buffer_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/buffer"
  output_path = "${path.module}/.build/buffer.zip"
}

data "archive_file" "stream_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/stream"
  output_path = "${path.module}/.build/stream.zip"
}

# --- Lambda Functions ---

resource "aws_lambda_function" "buffer_lambda" {
  function_name    = "bedrock-streaming-demo-buffer"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  timeout          = 120
  filename         = data.archive_file.buffer_lambda_zip.output_path
  source_code_hash = data.archive_file.buffer_lambda_zip.output_base64sha256
}

resource "aws_lambda_function" "stream_lambda" {
  function_name    = "bedrock-streaming-demo-stream"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  timeout          = 120
  filename         = data.archive_file.stream_lambda_zip.output_path
  source_code_hash = data.archive_file.stream_lambda_zip.output_base64sha256
}

# --- Lambda Permissions (allow API Gateway to invoke) ---

resource "aws_lambda_permission" "buffer_lambda_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.buffer_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "stream_lambda_permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stream_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}
