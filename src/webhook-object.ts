export interface WebhookEventObject {
	destination: string;
	events: Event[];
}

export interface Event {
	replyToken: string;
	type: string;
	mode: string;
	timestamp: number;
	source: Source;
	webhookEventId: string;
	deliveryContext: DeliveryContext;
	message: Message;
}

export interface Source {
	type: string;
	userId: string;
}

export interface DeliveryContext {
	isRedelivery: boolean;
}

export interface Message {
	id: string;
	type: string;
	duration: number;
	contentProvider: ContentProvider;
}

export interface ContentProvider {
	type: string;
}
