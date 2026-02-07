describe("Browser back navigation with guards", () => {
	it("should handle back navigation cleanly after login flow", async () => {
		await browser.url("/index.html");

		// Login
		const toggleBtn = await browser.asControl({
			selector: { id: "container-demo.app---homeView--toggleLoginBtn" }
		});
		await toggleBtn.press();

		// Navigate to Protected
		const navBtn = await browser.asControl({
			selector: { id: "container-demo.app---homeView--navProtectedBtn" }
		});
		await navBtn.press();

		// Verify we're on Protected
		const protectedPage = await browser.asControl({
			selector: { id: "container-demo.app---protectedView--protectedPage" }
		});
		expect(await protectedPage.getProperty("title")).toBe("Protected Page");

		// Browser back
		await browser.back();
		await browser.pause(500);

		// Should be on Home
		const homePage = await browser.asControl({
			selector: { id: "container-demo.app---homeView--homePage" }
		});
		expect(await homePage.getProperty("title")).toBe("Home");
	});
});
