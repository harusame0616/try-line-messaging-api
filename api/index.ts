import { Hono } from "hono";
import { handle } from "hono/vercel";
import crypto from "node:crypto";
import type { WebhookEventObject } from "./webhook-object";

export const config = {
	runtime: "edge",
};

const app = new Hono().basePath("/api");

app.get("/", async (c) => {
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const channelSecret = process.env.CHANNEL_SECRET!;

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
				toUserId: body.events[0].source.userId,
			}),
		),
	);

	return new Response("ok", { status: 200 });
});

async function sendMessage({
	messages,
	replyToken,
	toUserId,
}: { messages: string[]; replyToken: string; toUserId: string }) {
	const url = "https://api.line.me/v2/bot/message/reply";

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
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
export default handle(app);
