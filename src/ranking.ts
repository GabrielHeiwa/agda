import { Cluster } from "puppeteer-cluster";
import { cpus } from "os";
import { readFileSync, writeFileSync } from "node:fs";
import puppeteer from "puppeteer";
import { connection } from "./database/conn";

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

	const sitesAlreadyChecked = await connection.urls.findMany();
	const urlsAlreadyCheckeds = sitesAlreadyChecked
		.filter((site) => !site.checked)
		.map((site) => site.url);

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
				if (aLink.href.includes("duckduckgo")) continue;
				else _links.push(aLink.href);
			}
			return [..._links];
		});

		for (const site of linksCollected) {
			if (urlsAlreadyCheckeds.includes(site)) continue;
			else links.push(site);
		}

		await page.close();
	}

	await browser.close();

	_cluster.task(async ({ page, data: url }) => {
		console.log("SCRAPING - " + url);

		await page.goto(url);
		await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 0 });

		const content = await page.evaluate(
			// @ts-ignore
			() => document.querySelector("*").outerHTML
		);

		console.log(content);

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

		await connection.urls
			.create({
				data: {
					checked: true,
					url,
				},
			})
			.then(console.log)
			.catch(console.log);
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
