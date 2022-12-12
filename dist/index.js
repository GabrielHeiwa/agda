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
const puppeteer_1 = __importDefault(require("puppeteer"));
const node_fs_1 = __importDefault(require("node:fs"));
const puppeteer_cluster_1 = require("puppeteer-cluster");
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
const wc = new Map();
function boostrap() {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch({ headless: false });
        const cluster = yield puppeteer_cluster_1.Cluster.launch({
            concurrency: puppeteer_cluster_1.Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 4,
            monitor: true,
            puppeteerOptions: {
                headless: false,
            },
        });
        cluster.task(({ page, data: url }) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield page.goto(url);
            yield page.waitForNavigation({ waitUntil: "networkidle2" });
            const text = yield page.$eval("*", (el) => {
                var _a;
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNode(el);
                selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
                selection === null || selection === void 0 ? void 0 : selection.addRange(range);
                return (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.toString();
            });
            const words = text === null || text === void 0 ? void 0 : text.split(" ");
            if (Array.isArray(words))
                for (const word of words) {
                    const hasWord = (_a = wc.get(word)) !== null && _a !== void 0 ? _a : 0;
                    wc.set(word, hasWord + 1);
                }
            return;
        }));
        for (const topic of topics) {
            const page = yield browser.newPage();
            yield page.goto("https://duckduckgo.com");
            yield page.type("input#search_form_input_homepage", topic);
            yield page.keyboard.press("Enter");
            yield page.waitForNavigation({ waitUntil: "networkidle2" });
            const selector = "a.result--more__btn";
            for (let i = 0; i < 1; i++) {
                yield page.waitForSelector(selector);
                yield page.click(selector);
            }
            const links = yield page.evaluate(() => {
                const containerLinks = document.querySelector("div#links");
                if (!containerLinks)
                    return [];
                const aLinks = containerLinks.querySelectorAll("div article div div a");
                const _links = [];
                for (const aLink of aLinks) {
                    _links.push(aLink.href);
                }
                return [..._links];
            });
            node_fs_1.default.writeFileSync("links-" + topic + ".txt", links.join("\n"), {
                encoding: "utf-8",
            });
            page.close();
        }
        yield browser.close();
        const linksFile = topics.map((topic) => "links-" + topic + ".txt");
        for (const linkFile of linksFile) {
            const links = node_fs_1.default
                .readFileSync(linkFile, { encoding: "utf-8" })
                .split("\n");
            for (const url of links)
                cluster.queue(url);
        }
        yield cluster.idle();
        yield cluster.close();
        const wcRanking = [];
        for (const [word, quantity] of wc.entries())
            wcRanking.push({ word, quantity });
        wcRanking.sort((a, b) => {
            if (a.quantity > b.quantity)
                return 1;
            if (a.quantity < b.quantity)
                return -1;
            return 0;
        });
        node_fs_1.default.writeFileSync("./results.json", JSON.stringify(wcRanking, null, 2), {
            encoding: "utf-8",
        });
        return;
    });
}
boostrap();
