import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

const PROMPT =
  "Write a detailed, comprehensive guide about the history and evolution of cloud computing, covering at least the following topics: early mainframe time-sharing, the rise of virtualization, the birth of AWS and public cloud, the evolution of serverless computing, containers and Kubernetes, and future trends. Be thorough and include specific dates, companies, and technical details.";

const client = new BedrockRuntimeClient({ region: "eu-west-2" });

export const handler = awslambda.streamifyResponse(
  async (event, responseStream, context) => {
    responseStream = awslambda.HttpResponseStream.from(responseStream, {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
    });

    try {
      const command = new ConverseStreamCommand({
        modelId: "amazon.nova-lite-v1:0",
        messages: [
          {
            role: "user",
            content: [{ text: PROMPT }],
          },
        ],
        inferenceConfig: {
          maxTokens: 2048,
        },
      });

      const response = await client.send(command);

      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta?.text) {
          responseStream.write(event.contentBlockDelta.delta.text);
        }
      }

      responseStream.end();
    } catch (error) {
      responseStream.write(`Error generating response: ${error.message}`);
      responseStream.end();
    }
  }
);
