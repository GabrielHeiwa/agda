import puppeteer from "puppeteer";
import fs from "node:fs";
import { Agent } from "node:http";
import { diarinhoProvider } from "./providers/diarinho";

const topics = [
	"Cidades inteligentes em santa catarina",
	"Cidades inteligentes no brasil",
	"Cidades inteligentes pela ISO",
];

const keywords = [
	"cidades inteligentes",
	"desenvolvimento sustentável",
	"qualidade de vida",
];

async function boostrap() {
	const browser = await puppeteer.launch({ headless: false });

	await diarinhoProvider(browser)

	// for (const topic of topics) {
	// 	const page = await browser.newPage();

	// 	await page.goto("https://duckduckgo.com");
	// 	await page.type("input#search_form_input_homepage", topic);
	// 	await page.keyboard.press("Enter");

	// 	await page.waitForNavigation({ waitUntil: "networkidle2" });

	// 	const selector = "a.result--more__btn";
	// 	for (let i = 0; i < 10; i++) {
	// 		await page.waitForSelector(selector);
	// 		await page.click(selector);
	// 	}

	// 	const links = await page.evaluate(() => {
	// 		const containerLinks = document.querySelector("div#links");
	// 		if (!containerLinks) return [];
	// 		const aLinks = containerLinks.querySelectorAll(
	// 			"div article div div a"
	// 		) as NodeListOf<HTMLAnchorElement>;
	// 		const _links: string[] = [];
	// 		for (const aLink of aLinks) {
	// 			_links.push(aLink.href);
	// 		}
	// 		return [..._links];
	// 	});

	// 	fs.writeFileSync("links-" + topic + ".txt", links.join("\n"), {
	// 		encoding: "utf-8",
	// 	});

	// 	page.close();
	// }

	// const linksFile = topics.map((topic) => "links-" + topic + ".txt");

	// for (const linkFile of linksFile) {
	// 	const links = fs
	// 		.readFileSync(linkFile, { encoding: "utf-8" })
	// 		.split("\n");
	// 	console.log({ topic: linkFile, totalLinks: links.length });
	// 	// const page = await browser.newPage();

	// 	// await page.goto()
	// }

	// const pageContent = await page.content();
	// fs.writeFile("content", pageContent, { encoding: "utf-8" }, (err) => {
	// 	if (err) return console.error("Error to save page content");

	// 	console.log("Save content of page with success");
	// 	return;
	// });

	// const readable = fs.createReadStream("content");
	// readable.on("data", (chunk) => {
	// 	const decodeChunk = chunk.toString("utf-8");
	// 	const hasTopic = /cidades inteligentes/.test(decodeChunk);

	// 	if (hasTopic) console.log(decodeChunk);
	// });

	// readable.on("end", () => console.log("Finish to read content page"));
}

boostrap();
