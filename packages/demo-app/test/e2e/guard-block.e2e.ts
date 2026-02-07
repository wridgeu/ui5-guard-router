describe("Guard blocks navigation", () => {
	it("should stay on Home when navigating to Protected while logged out", async () => {
		await browser.url("/index.html");

		// Verify we start on Home and are logged out
		const status = await browser.asControl({
			selector: { id: "container-demo.app---homeView--authStatus" }
		});
		expect(await status.getProperty("text")).toBe("Logged Out");

		// Try to navigate to protected
		const navBtn = await browser.asControl({
			selector: { id: "container-demo.app---homeView--navProtectedBtn" }
		});
		await navBtn.press();

		// Should still be on Home (guard redirected)
		await browser.pause(500);
		const homePage = await browser.asControl({
			selector: { id: "container-demo.app---homeView--homePage" }
		});
		expect(await homePage.getProperty("title")).toBe("Home");
	});

	it("should not have a hash fragment for the protected route", async () => {
		const url = await browser.getUrl();
		expect(url).not.toContain("#/protected");
	});
});
