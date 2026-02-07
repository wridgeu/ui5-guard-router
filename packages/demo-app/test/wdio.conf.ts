export const config: WebdriverIO.Config = {
	runner: "local",
	specs: ["./e2e/**/*.e2e.ts"],
	maxInstances: 1,
	capabilities: [
		{
			browserName: "chrome",
			"goog:chromeOptions": {
				args: ["--headless", "--no-sandbox", "--disable-gpu", "--window-size=1920,1080"]
			}
		}
	],
	logLevel: "warn",
	bail: 0,
	baseUrl: "http://localhost:8080",
	waitforTimeout: 10000,
	connectionRetryTimeout: 120000,
	connectionRetryCount: 3,
	services: [
		"ui5"
	],
	framework: "mocha",
	reporters: ["spec"],
	mochaOpts: {
		ui: "bdd",
		timeout: 60000
	}
};
