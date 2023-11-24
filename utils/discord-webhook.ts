import got from "got";
import DiscordAPI from "discord-api-types/v8";

export type WebhookPayload = DiscordAPI.RESTPostAPIWebhookWithTokenJSONBody;

export default (
    wbhk:
        | string
        | {
              id: string;
              token: string;
          },
    payload: WebhookPayload
) => {
    const url =
        typeof wbhk === "string"
            ? wbhk
            : `https://discord.com/api/webhooks/${wbhk.id}/${wbhk.token}`;

    const contentType = "application/json";
    return got.post(url, {
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": contentType,
        },
    });
};
