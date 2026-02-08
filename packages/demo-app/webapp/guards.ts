import Log from "sap/base/Log";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { GuardFn, GuardContext, GuardResult } from "ui5/ext/routing/types";

/**
 * Guard that requires the user to be logged in.
 * Redirects to "home" if not authenticated.
 */
export function createAuthGuard(authModel: JSONModel): GuardFn {
	return (context: GuardContext): GuardResult => {
		const isLoggedIn = authModel.getProperty("/isLoggedIn");
		if (!isLoggedIn) {
			Log.info(`Auth guard blocked navigation to "${context.toRoute}"`, "demo.app.guards");
		}
		return isLoggedIn ? true : "home";
	};
}

/**
 * Guard that always blocks navigation and redirects to "home".
 */
export const forbiddenGuard: GuardFn = () => "home";
