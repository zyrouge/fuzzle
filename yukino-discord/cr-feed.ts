import { chunk } from "lodash";
import RssParser from "rss-parser";
import {
    DiscordWebhookPayload,
    commonStorage,
    handleTask,
    postDiscordWebhook,
    sleep,
} from "../utils";

const HOOK_NAME = "CrunchyRoll News";
const HOOK_AVATAR =
    "https://www.crunchyroll.com/build/assets/img/favicons/favicon-96x96.png";
const CR_FEED_URL =
    "https://cr-news-api-service.prd.crunchyrollsvc.com/v1/en-US/rss";
const SLEEP_INTERVAL = 2000;
const COMMON_STORAGE_KEY = "yukino-discord-cr-feed";

const start = async () => {
    const webhookURL = process.env.YUKINO_CR_WEBHOOK_URL;
    if (!webhookURL) {
        throw new Error("Missing 'process.env.YUKINO_CR_WEBHOOK_URL'");
    }

    const rss = new RssParser({
        customFields: {
            item: ["media:thumbnail"],
        },
    });

    let { items: allFeeds } = await rss.parseURL(CR_FEED_URL);
    const lastUpdated = await commonStorage.get(COMMON_STORAGE_KEY, 0);
    if (lastUpdated) {
        allFeeds = allFeeds.filter((x) => {
            if (!x.isoDate) return false;
            const date = new Date(x.isoDate).getTime();
            return date > lastUpdated;
        });
    }
    if (!allFeeds.length) {
        return console.log("Nothing new in feeds");
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
                color: 0xf47521,
                thumbnail: {
                    url: x["media:thumbnail"].$.url,
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
