import { Cluster } from "puppeteer-cluster";
import { cpus } from "os";
import { readFileSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer";

const wordsRankingJson = JSON.parse(
	readFileSync("./wordsRanking.json", { encoding: "utf-8" })
);

const coresLength = cpus().length;

const topics = ["Cidades inteligentes em Santa Catarina"];
const ranking = new Map();


async function main() {
	// INITIALIZATE THE CRAWLERS
	const browser = await puppeteer.launch({ headless: false });
	const _cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_CONTEXT,
		maxConcurrency: coresLength,
		// monitor: true,
		puppeteerOptions: { headless: false },
	});

	// COLLECT THE LINKS FOR THE RANKING
	let links: any[] = [];
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

		const linksCollected = await page.evaluate(() => {
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

		links = [...links, ...linksCollected];

		await page.close();
	}

	await browser.close();

	_cluster.task(async ({ page, data: url }) => {
		await page.goto(url);
		await page.waitForNavigation({ waitUntil: "networkidle2" });

		const content = await page.$eval("*", (el) => {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNode(el);
			selection?.removeAllRanges();
			selection?.addRange(range);
			return window.getSelection()?.toString();
		});

		if (!content) return;
		const words = content.split(" ");
		for (const word of words) {
			const sanitazeWord = word.toLocaleLowerCase().replace(/\W/, "");
			
			for (const wordRaking of wordsRankingJson) {
				if (sanitazeWord.includes(wordRaking.word)) {
					const hasUrl = ranking.get(url) ?? 0;
					ranking.set(url, hasUrl + wordRaking.perc);
				}
			}
		}
	});

	for (const url of links) await _cluster.queue(url);

	await _cluster.idle();
	await _cluster.close();

	const siteRanking: any[] = [];
	for (const [site, weight] of ranking.entries())
		siteRanking.push({ site, weight });

	siteRanking.sort((a, b) => a.weight - b.weight);

	writeFileSync("site_ranking.json", JSON.stringify(siteRanking, null, 2));

	return 0;
}

main();
