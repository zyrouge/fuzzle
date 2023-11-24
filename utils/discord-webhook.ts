import { request } from "undici";
import DiscordAPI from "discord-api-types/v10";

export interface DiscordWebhookInfo {
    id: string;
    token: string;
}

export type DiscordWebhookPayload =
    DiscordAPI.RESTPostAPIWebhookWithTokenJSONBody;

export const postDiscordWebhook = async (
    webhook: string | DiscordWebhookInfo,
    payload: DiscordWebhookPayload
) => {
    const url =
        typeof webhook === "string"
            ? webhook
            : `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;
    const resp = await request(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (resp.statusCode !== 204) {
        throw new Error(`Webhook request failed with status ${resp.statusCode}`);
    }
};
