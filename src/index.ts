import puppeteer from "puppeteer";
import fs from "node:fs";
import { queue } from "./bull";
import { Cluster } from "puppeteer-cluster";

const topics = [
	"Cidades inteligentes em Santa Catarina",
	// "Cidades inteligentes no brasil",
	// "Cidades inteligentes pela ISO",
];

// const keywords = [
// 	"cidades inteligentes",
// 	"desenvolvimento sustentável",
// 	"qualidade de vida",
// ];

const wc = new Map<string, number>();

async function boostrap() {
	const browser = await puppeteer.launch({ headless: false });
	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_CONTEXT,
		maxConcurrency: 4,
		monitor: true,
		puppeteerOptions: {
			headless: false,
		},
	});

	cluster.task(async ({ page, data: url }) => {
		await page.goto(url);
		await page.waitForNavigation({ waitUntil: "networkidle2" });

		const text = await page.$eval("*", (el) => {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNode(el);
			selection?.removeAllRanges();
			selection?.addRange(range);
			return window.getSelection()?.toString();
		});

		const words = text?.split(" ");
		if (Array.isArray(words))
			for (const word of words) {
				const hasWord = wc.get(word) ?? 0;
				wc.set(word, hasWord + 1);
			}

		return;
	});

	for (const topic of topics) {
		const page = await browser.newPage();

		await page.goto("https://duckduckgo.com");
		await page.type("input#search_form_input_homepage", topic);
		await page.keyboard.press("Enter");

		await page.waitForNavigation({ waitUntil: "networkidle2" });

		const selector = "a.result--more__btn";
		for (let i = 0; i < 1; i++) {
			await page.waitForSelector(selector);
			await page.click(selector);
		}

		const links = await page.evaluate(() => {
			const containerLinks = document.querySelector("div#links");
			if (!containerLinks) return [];
			const aLinks = containerLinks.querySelectorAll(
				"div article div div a"
			) as NodeListOf<HTMLAnchorElement>;
			const _links: string[] = [];
			for (const aLink of aLinks) {
				_links.push(aLink.href);
			}
			return [..._links];
		});

		fs.writeFileSync("links-" + topic + ".txt", links.join("\n"), {
			encoding: "utf-8",
		});

		page.close();
	}

	await browser.close();

	const linksFile = topics.map((topic) => "links-" + topic + ".txt");

	for (const linkFile of linksFile) {
		const links = fs
			.readFileSync(linkFile, { encoding: "utf-8" })
			.split("\n");

		for (const url of links) cluster.queue(url);
	}

	await cluster.idle();
	await cluster.close();

	const wcRanking: { word: string; quantity: number }[] = [];
	for (const [word, quantity] of wc.entries())
		wcRanking.push({ word, quantity });

	wcRanking.sort((a, b) => {
		if (a.quantity > b.quantity) return 1;
		if (a.quantity < b.quantity) return -1;

		return 0;
	});

	fs.writeFileSync("./results.json", JSON.stringify(wcRanking, null, 2), {
		encoding: "utf-8",
	});

	return;
}

boostrap();
