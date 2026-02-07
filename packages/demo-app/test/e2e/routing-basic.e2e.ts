describe("Basic routing (no guard interaction)", () => {
	it("should load Home view at root hash", async () => {
		await browser.url("/index.html");
		const page = await browser.asControl({
			selector: { id: "container-demo.app---homeView--homePage" }
		});
		expect(await page.getProperty("title")).toBe("Home");
	});

	it("should show auth status as 'Logged Out' initially", async () => {
		const status = await browser.asControl({
			selector: { id: "container-demo.app---homeView--authStatus" }
		});
		expect(await status.getProperty("text")).toBe("Logged Out");
	});

	it("should navigate to Protected when logged in", async () => {
		// Login first
		const toggleBtn = await browser.asControl({
			selector: { id: "container-demo.app---homeView--toggleLoginBtn" }
		});
		await toggleBtn.press();

		// Navigate to protected
		const navBtn = await browser.asControl({
			selector: { id: "container-demo.app---homeView--navProtectedBtn" }
		});
		await navBtn.press();

		const page = await browser.asControl({
			selector: { id: "container-demo.app---protectedView--protectedPage" }
		});
		expect(await page.getProperty("title")).toBe("Protected Page");
	});

	it("should navigate back to Home", async () => {
		// Use the nav back button on the protected page
		const page = await browser.asControl({
			selector: { id: "container-demo.app---protectedView--protectedPage" }
		});
		await page.fireEvent("navButtonPress");

		const homePage = await browser.asControl({
			selector: { id: "container-demo.app---homeView--homePage" }
		});
		expect(await homePage.getProperty("title")).toBe("Home");
	});
});
