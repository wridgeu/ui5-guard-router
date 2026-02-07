describe("Guard allows navigation when logged in", () => {
	it("should allow navigation to Protected after login", async () => {
		await browser.url("/index.html");

		// Toggle login
		const toggleBtn = await browser.asControl({
			selector: { id: "container-demo.app---homeView--toggleLoginBtn" }
		});
		await toggleBtn.press();

		// Verify logged in
		const status = await browser.asControl({
			selector: { id: "container-demo.app---homeView--authStatus" }
		});
		expect(await status.getProperty("text")).toBe("Logged In");

		// Navigate to protected
		const navBtn = await browser.asControl({
			selector: { id: "container-demo.app---homeView--navProtectedBtn" }
		});
		await navBtn.press();

		// Should be on Protected page
		const page = await browser.asControl({
			selector: { id: "container-demo.app---protectedView--protectedPage" }
		});
		expect(await page.getProperty("title")).toBe("Protected Page");
	});

	it("should have the correct hash fragment", async () => {
		const url = await browser.getUrl();
		expect(url).toContain("#/protected");
	});
});
