describe("Guard redirects to Home", () => {
	it("should redirect from Forbidden to Home", async () => {
		await browser.url("/index.html");

		// Try to navigate to forbidden
		const navBtn = await browser.asControl({
			selector: { id: "container-demo.app---homeView--navForbiddenBtn" }
		});
		await navBtn.press();

		// Should be redirected to Home
		await browser.pause(500);
		const homePage = await browser.asControl({
			selector: { id: "container-demo.app---homeView--homePage" }
		});
		expect(await homePage.getProperty("title")).toBe("Home");
	});

	it("should not have forbidden in the URL", async () => {
		const url = await browser.getUrl();
		expect(url).not.toContain("#/forbidden");
	});
});
