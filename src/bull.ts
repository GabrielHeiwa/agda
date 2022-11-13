import bull from "bull";
import cp from "child_process";

interface JobType {
	url: string;
}
const command = "python main.py";

const queue = new bull<JobType>("words_cloud");
queue.process(async (job, done) => {
	const {
		data: { url },
	} = job;

	await new Promise((resolve, reject) => {
		try {
			cp.execSync(`${command} ${url}`);

			resolve(true);
		} catch (err) {
			reject(err);
		}
	});

	done();
});

export { queue };
