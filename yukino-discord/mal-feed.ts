import { chunk } from "lodash";
import RssParser from "rss-parser";
import {
    DiscordWebhookPayload,
    commonStorage,
    handleTask,
    postDiscordWebhook,
    sleep,
} from "../utils";

const HOOK_NAME = "MyAnimeList News";
const HOOK_AVATAR =
    "https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png";
const MAL_FEED_URL = "https://myanimelist.net/rss/news.xml";
const SLEEP_INTERVAL = 2000;
const COMMON_STORAGE_KEY = "yukino-discord-mal-feed";

const start = async () => {
    const webhookURL = process.env.YUKINO_MAL_WEBHOOK_URL;
    if (!webhookURL) {
        throw new Error("Missing 'process.env.YUKINO_MAL_WEBHOOK_URL'");
    }

    const rss = new RssParser({
        customFields: {
            item: ["media:thumbnail"],
        },
    });

    let { items: allFeeds } = await rss.parseURL(MAL_FEED_URL);
    const lastUpdated = await commonStorage.get(COMMON_STORAGE_KEY, 0);
    if (lastUpdated) {
        allFeeds = allFeeds.filter((x) => {
            if (!x.isoDate) return false;
            const date = new Date(x.isoDate).getTime();
            return date > lastUpdated;
        });
    }
    if (!allFeeds.length) {
        return console.log("Nothing new in feeds.");
    }

    allFeeds = allFeeds.sort(
        (a, b) =>
            new Date(a.isoDate!).getTime() - new Date(b.isoDate!).getTime()
    );

    let i = 1;
    for (const feeds of chunk(allFeeds, 5)) {
        const payload: DiscordWebhookPayload = {
            username: HOOK_NAME,
            avatar_url: HOOK_AVATAR,
            embeds: feeds.map((x) => ({
                title: x.title,
                description: x.content,
                url: x.link,
                color: 0x2f51a0,
                thumbnail: {
                    url: x["media:thumbnail"],
                },
                footer: {
                    text: `Published: ${x.pubDate}`,
                },
            })),
        };

        await handleTask(`${HOOK_NAME}-DiscordPost${i}`, () =>
            postDiscordWebhook(webhookURL, payload)
        );
        i += 1;
        await sleep(SLEEP_INTERVAL);
    }

    await handleTask(`${HOOK_NAME}-UpdateTime`, () =>
        commonStorage.set(COMMON_STORAGE_KEY, Date.now())
    );
};

start();
