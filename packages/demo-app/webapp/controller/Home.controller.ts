import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";

/**
 * @namespace demo.app.controller
 */
export default class HomeController extends Controller {
	onToggleLogin(): void {
		const model = (this.getOwnerComponent() as UIComponent).getModel("auth") as JSONModel;
		const isLoggedIn = model.getProperty("/isLoggedIn");
		model.setProperty("/isLoggedIn", !isLoggedIn);
	}

	onNavToProtected(): void {
		(this.getOwnerComponent() as UIComponent).getRouter().navTo("protected");
	}

	onNavToForbidden(): void {
		(this.getOwnerComponent() as UIComponent).getRouter().navTo("forbidden");
	}
}
