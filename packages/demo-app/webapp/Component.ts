import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { GuardRouter } from "ui5/ext/routing/types";
import { createAuthGuard, forbiddenGuard } from "./guards";

/**
 * @namespace demo.app
 */
export default class Component extends UIComponent {
	public static metadata = {
		manifest: "json",
		interfaces: ["sap.ui.core.IAsyncContentCreation"],
	};

	init(): void {
		super.init();

		const router = this.getRouter() as unknown as GuardRouter;
		const authModel = this.getModel("auth") as JSONModel;

		router.addRouteGuard("protected", createAuthGuard(authModel));
		router.addRouteGuard("forbidden", forbiddenGuard);

		router.initialize();
	}
}
