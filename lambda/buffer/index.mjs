import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

const PROMPT =
  "Write a detailed, comprehensive guide about the history and evolution of cloud computing, covering at least the following topics: early mainframe time-sharing, the rise of virtualization, the birth of AWS and public cloud, the evolution of serverless computing, containers and Kubernetes, and future trends. Be thorough and include specific dates, companies, and technical details.";

const client = new BedrockRuntimeClient({ region: "eu-west-2" });

export const handler = async (event, context) => {
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

    let result = "";
    for await (const event of response.stream) {
      if (event.contentBlockDelta?.delta?.text) {
        result += event.contentBlockDelta.delta.text;
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: result,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: `Error generating response: ${error.message}`,
    };
  }
};
