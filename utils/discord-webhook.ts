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
    return request(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json",
        },
    });
};
