describe("Direct URL navigation with guards", () => {
	it("should redirect to Home when accessing #/protected directly while logged out", async () => {
		// Navigate directly to protected route via URL
		await browser.url("/index.html#/protected");
		await browser.pause(1000);

		// Should be redirected to Home (guard blocks and redirects)
		const homePage = await browser.asControl({
			selector: { id: "container-demo.app---homeView--homePage" }
		});
		expect(await homePage.getProperty("title")).toBe("Home");
	});

	it("should redirect to Home when accessing #/forbidden directly", async () => {
		// Navigate directly to forbidden route via URL
		await browser.url("/index.html#/forbidden");
		await browser.pause(1000);

		// Should be redirected to Home
		const homePage = await browser.asControl({
			selector: { id: "container-demo.app---homeView--homePage" }
		});
		expect(await homePage.getProperty("title")).toBe("Home");
	});
});
