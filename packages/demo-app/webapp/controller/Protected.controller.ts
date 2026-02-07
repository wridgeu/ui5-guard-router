import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";

/**
 * @namespace demo.app.controller
 */
export default class ProtectedController extends Controller {
	onNavBack(): void {
		(this.getOwnerComponent() as UIComponent).getRouter().navTo("home");
	}
}
