import UIComponent from "sap/ui/core/UIComponent";

/**
 * @namespace demo.app
 */
export default class Component extends UIComponent {
	public static metadata = {
		manifest: "json",
		interfaces: ["sap.ui.core.IAsyncContentCreation"]
	};

	init(): void {
		super.init();

		const router = this.getRouter() as any;

		// Guard: "protected" route requires login
		router.addRouteGuard("protected", () => {
			const isLoggedIn = this.getModel("auth")?.getProperty("/isLoggedIn");
			return isLoggedIn ? true : "home";
		});

		// Guard: "forbidden" route is always blocked
		router.addRouteGuard("forbidden", () => "home");

		router.initialize();
	}
}
