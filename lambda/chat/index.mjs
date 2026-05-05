import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "eu-west-2" });

const ALLOWED_MODELS = [
  "amazon.nova-lite-v1:0",
  "anthropic.claude-haiku-4-5-20251001-v1:0",
  "anthropic.claude-opus-4-7",
  "anthropic.claude-sonnet-4-6",
];

const DEFAULT_MODEL = "amazon.nova-lite-v1:0";

// Map Claude models to their Global CRIS inference profile IDs
const GLOBAL_CRIS_MAP = {
  "anthropic.claude-haiku-4-5-20251001-v1:0": "global.anthropic.claude-haiku-4-5-20251001-v1:0",
  "anthropic.claude-opus-4-7": "global.anthropic.claude-opus-4-7",
  "anthropic.claude-sonnet-4-6": "global.anthropic.claude-sonnet-4-6",
};

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, _context) => {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      responseStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
      responseStream.write(JSON.stringify({ error: "Invalid JSON in request body" }));
      responseStream.end();
      return;
    }

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      responseStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
      responseStream.write(
        JSON.stringify({ error: "Request body must contain a non-empty 'messages' array" })
      );
      responseStream.end();
      return;
    }

    const modelId = body.modelId || DEFAULT_MODEL;
    if (!ALLOWED_MODELS.includes(modelId)) {
      responseStream = awslambda.HttpResponseStream.from(responseStream, {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
      responseStream.write(
        JSON.stringify({ error: `Invalid model. Allowed: ${ALLOWED_MODELS.join(", ")}` })
      );
      responseStream.end();
      return;
    }

    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Access-Control-Allow-Origin": "*",
      },
    });

    try {
      const resolvedModelId = GLOBAL_CRIS_MAP[modelId] || modelId;
      const command = new ConverseStreamCommand({
        modelId: resolvedModelId,
        messages: body.messages.map((msg) => ({
          role: msg.role,
          content: [{ text: msg.content }],
        })),
        inferenceConfig: { maxTokens: 4096 },
      });

      const response = await client.send(command);

      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta?.text) {
          const chunk = event.contentBlockDelta.delta.text;
          responseStream.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
      }
    } catch (error) {
      responseStream.write(
        `data: ${JSON.stringify({ error: error.message })}\n\n`
      );
    }

    responseStream.write("data: [DONE]\n\n");
    responseStream.end();
  }
);
