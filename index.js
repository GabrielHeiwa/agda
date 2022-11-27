
const fs = require("node:fs");
const new_results = require("./new_results.json");

const TOTAL = new_results.reduce((prev, el) => prev + el.quantity, 0);

const results_with_weight_words = [];

for (const result of new_results) {
    const perc = 100 * result.quantity / TOTAL;
    result.perc = perc;

    results_with_weight_words.push(result)
}



fs.writeFileSync("results_with_weights.json", JSON.stringify(results_with_weight_words.sort((a, b) => a.perc - b.perc), null, 2));


