"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_cluster_1 = require("puppeteer-cluster");
const os_1 = require("os");
const node_fs_1 = require("node:fs");
const puppeteer_1 = __importDefault(require("puppeteer"));
const conn_1 = require("./database/conn");
const wordsRankingJson = JSON.parse((0, node_fs_1.readFileSync)("./wordsRanking.json", { encoding: "utf-8" }));
const coresLength = (0, os_1.cpus)().length;
const topics = ["Cidades inteligentes em Santa Catarina"];
const ranking = new Map();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // INITIALIZATE THE CRAWLERS
        const browser = yield puppeteer_1.default.launch({ headless: false });
        const _cluster = yield puppeteer_cluster_1.Cluster.launch({
            concurrency: puppeteer_cluster_1.Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: coresLength,
            monitor: true,
            puppeteerOptions: { headless: true },
        });
        // COLLECT THE LINKS FOR THE RANKING
        const sitesAlreadyChecked = yield conn_1.connection.urls.findMany();
        const urlsAlreadyCheckeds = sitesAlreadyChecked
            .filter((site) => !site.checked)
            .map((site) => site.url);
        let links = [];
        for (const topic of topics) {
            const page = yield browser.newPage();
            yield page.goto("https://duckduckgo.com");
            yield page.type("input#search_form_input_homepage", topic);
            yield page.keyboard.press("Enter");
            yield page.waitForNavigation({ waitUntil: "networkidle2" });
            const selector = "a.result--more__btn";
            for (let i = 0; i < 10; i++) {
                yield page.waitForSelector(selector);
                yield page.click(selector);
            }
            const linksCollected = yield page.evaluate(() => {
                const containerLinks = document.querySelector("div#links");
                if (!containerLinks)
                    return [];
                const aLinks = containerLinks.querySelectorAll("div article div div a");
                const _links = [];
                for (const aLink of aLinks) {
                    if (aLink.href.includes("duckduckgo"))
                        continue;
                    else
                        _links.push(aLink.href);
                }
                return [..._links];
            });
            for (const site of linksCollected) {
                if (urlsAlreadyCheckeds.includes(site))
                    continue;
                else
                    links.push(site);
            }
            yield page.close();
        }
        yield browser.close();
        _cluster.task(({ page, data: url }) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield page.goto(url);
            const content = yield page.$eval('*', (el) => {
                var _a;
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNode(el);
                selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
                selection === null || selection === void 0 ? void 0 : selection.addRange(range);
                return (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.toString();
            });
            if (!content)
                return;
            const words = content.split(" ");
            for (const word of words) {
                const sanitazeWord = word.toLocaleLowerCase().replace(/\W/, "");
                for (const wordRaking of wordsRankingJson) {
                    if (sanitazeWord.includes(wordRaking.word)) {
                        const hasUrl = (_a = ranking.get(url)) !== null && _a !== void 0 ? _a : 0;
                        ranking.set(url, hasUrl + wordRaking.perc);
                    }
                }
            }
            yield conn_1.connection.urls
                .create({
                data: {
                    checked: true,
                    url,
                    score: Number(ranking.get(url))
                },
            });
        }));
        for (const url of links)
            yield _cluster.queue(url);
        yield _cluster.idle();
        yield _cluster.close();
        const siteRanking = [];
        for (const [site, weight] of ranking.entries())
            siteRanking.push({ site, weight });
        siteRanking.sort((a, b) => a.weight - b.weight);
        (0, node_fs_1.writeFileSync)("site_ranking.json", JSON.stringify(siteRanking, null, 2));
        return 0;
    });
}
main();
