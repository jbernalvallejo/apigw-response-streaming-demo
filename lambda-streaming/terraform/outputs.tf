output "buffer_endpoint_url" {
  description = "Invoke URL for the buffered endpoint"
  value       = "${aws_api_gateway_stage.demo.invoke_url}/buffer"
}

output "stream_endpoint_url" {
  description = "Invoke URL for the streaming endpoint"
  value       = "${aws_api_gateway_stage.demo.invoke_url}/stream"
}
