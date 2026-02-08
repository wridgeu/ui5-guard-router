import { waitForPage, fireEvent, resetAuth, setDirtyState, expectHashToBe } from "./helpers";

async function loginAndGoToProtected(): Promise<void> {
	await fireEvent("container-demo.app---homeView--toggleLoginBtn", "press");
	await fireEvent("container-demo.app---homeView--navProtectedBtn", "press");
	await waitForPage("container-demo.app---protectedView--protectedPage", "Protected Page");
}

describe("Leave Guard - Dirty Form", () => {
	beforeEach(async () => {
		await resetAuth();
		await browser.goTo({ sHash: "" });
		await waitForPage("container-demo.app---homeView--homePage", "Home");
	});

	it("should allow leaving protected page when form is clean", async () => {
		await loginAndGoToProtected();
		await setDirtyState(false);

		await fireEvent("container-demo.app---protectedView--protectedPage", "navButtonPress");
		await waitForPage("container-demo.app---homeView--homePage", "Home");
	});

	it("should block leaving protected page when form is dirty", async () => {
		await loginAndGoToProtected();
		await setDirtyState(true);

		await fireEvent("container-demo.app---protectedView--protectedPage", "navButtonPress");
		await expectHashToBe("#/protected");
	});

	it("should allow leaving after clearing dirty state", async () => {
		await loginAndGoToProtected();
		await setDirtyState(true);
		await setDirtyState(false);

		await fireEvent("container-demo.app---protectedView--protectedPage", "navButtonPress");
		await waitForPage("container-demo.app---homeView--homePage", "Home");
	});

	it("should block browser back when form is dirty", async () => {
		await loginAndGoToProtected();
		await setDirtyState(true);

		await browser.execute(() => window.history.back());
		await expectHashToBe("#/protected", "Hash did not settle back to #/protected after browser back");
	});
});
