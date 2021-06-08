import path from "path";
import fs from "fs-extra";
import { chunk } from "lodash";
import RssParser from "rss-parser";
import DiscordWebhook, { WebhookPayload } from "../../utils/discord-webhook";
import ExecuteOrReturn from "../../utils/execute-or-return";
import HandlePromiseEnd from "../../utils/handle-promise-end";
import sleep from "../../utils/sleep";

const HookName = "MyAnimeList News";
const HookAvatar =
    "https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png";
const MALFeedURL = "https://myanimelist.net/rss/news.xml";
const LastFeedDataFile = path.join(__dirname, "lastfeed.json");
const SleepInterval = 2000;

export default ExecuteOrReturn(async () => {
    const webhookURL = process.env.YUKINO_MAL_WEBHOOK_URL;
    if (!webhookURL)
        throw new Error("Missing 'process.env.YUKINO_MAL_WEBHOOK_URL'");

    const rss = new RssParser({
        customFields: {
            item: ["media:thumbnail"],
        },
    });

    let { items: allFeeds } = await rss.parseURL(MALFeedURL);
    const lastUpdated = await getLastFeedTime();
    if (lastUpdated) {
        allFeeds = allFeeds.filter((x) => {
            if (!x.isoDate) return false;
            const date = new Date(x.isoDate).getTime();
            return date > lastUpdated;
        });
    }
    if (!allFeeds.length)
        return console.log(`Seems like no new feeds were available!`);

    allFeeds = allFeeds.sort(
        (a, b) =>
            new Date(a.isoDate!).getTime() - new Date(b.isoDate!).getTime()
    );

    let i = 1;
    for (const feeds of chunk(allFeeds, 5)) {
        const payload: WebhookPayload = {
            username: HookName,
            avatar_url: HookAvatar,
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

        await HandlePromiseEnd(
            `${HookName}-${i}`,
            DiscordWebhook(webhookURL, payload)
        );
        i += 1;
        await sleep(SleepInterval);
    }

    HandlePromiseEnd(`${HookName}-Info-File`, updateLastFeedTime());
});

async function getLastFeedTime(): Promise<number | null> {
    try {
        const raw = await fs.readFile(LastFeedDataFile);
        const parsed = JSON.parse(raw.toString());
        return parsed.time || null;
    } catch (err) {
        return null;
    }
}

async function updateLastFeedTime(time?: number) {
    return fs.writeFile(
        LastFeedDataFile,
        JSON.stringify(
            {
                time: time || Date.now(),
            },
            null,
            4
        )
    );
}
