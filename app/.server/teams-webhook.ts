import type { AppLoadContext } from "@remix-run/cloudflare";

export class teamsWebhook {
	private webhookUrl: string;

	constructor(context: AppLoadContext) {
		const env = context.cloudflare.env;
		this.webhookUrl = env.TEAMS_WEBHOOK_URL as string;
	}

	sendCard = async (summary: string, card: object) => {
		await fetch(this.webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload(summary, card)),
		});
	};
}

const payload = (summary: string, card: object) => {
	return {
		type: "message",
		summary: summary,
		attachments: [
			{
				contentType: "application/vnd.microsoft.card.adaptive",
				contentUrl: null,
				content: card,
			},
		],
	};
};

export const createCard = (title: string, text: string) => {
	return {
		type: "AdaptiveCard",
		body: [
			{
				type: "TextBlock",
				size: "Large",
				weight: "Bolder",
				text: title,
			},
			{
				type: "TextBlock",
				text: text,
				wrap: true,
			},
		],
		$schema: "http://adaptivecards.io/schemas/adaptive-card.json",
		version: "1.5",
	};
};
