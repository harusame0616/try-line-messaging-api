// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { Hono } from "hono";
import type { WebhookEventObject } from "./webhook-object";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import * as crypto from "crypto";

const app = new Hono();

app.post("/", async (c) => {
	console.log("called");
	const channelSecret = c.env.CHANNEL_SECRET!;

	const body: WebhookEventObject = await c.req.json();
	const header = c.req.header("x-line-signature");

	console.log(body);

	const signature = crypto
		.createHmac("SHA256", channelSecret)
		.update(JSON.stringify(body))
		.digest("base64");

	if (header !== signature) {
		console.log("Invalid signature");
		return c.json({ message: "Invalid signature" }, 401);
	}

	const replyTokens = body.events.map((event) => event.replyToken);

	await Promise.all(
		replyTokens.map((replyToken) =>
			sendMessage({
				messages: ["Hello, world!"],
				replyToken,
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				channelAccessToken: c.env.CHANNEL_ACCESS_TOKEN!,
			}),
		),
	);

	return c.json({ message: "ok" });
});

async function sendMessage({
	messages,
	replyToken,
	channelAccessToken,
}: { messages: string[]; replyToken: string; channelAccessToken: string }) {
	const url = "https://api.line.me/v2/bot/message/reply";

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${channelAccessToken}`,
	};

	const body = {
		replyToken,
		messages: messages.map((message) => ({
			type: "text",
			text: message,
		})),
	};

	const response = await fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
	});

	return response.json();
}

export default app;
