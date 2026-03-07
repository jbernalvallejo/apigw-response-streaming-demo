# Product Overview

API Gateway Response Streaming Demo — a side-by-side comparison of Amazon API Gateway's buffered vs streaming response modes.

Both endpoints invoke the same Amazon Bedrock Nova Lite model via ConverseStream. The buffered endpoint collects the full LLM response before returning it; the streaming endpoint writes chunks to the client as they arrive, demonstrating improved time-to-first-byte.

This is a demo/reference project, not a production service. Its purpose is to illustrate the architectural difference between buffered and streaming Lambda integrations behind API Gateway.
