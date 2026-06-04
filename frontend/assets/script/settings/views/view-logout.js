import { clearCsrfToken } from "../../base_api.js";
import { hideLoader, showInlineNotification, showLoader, showMessage } from "../../panel-handling.js";
import { requestLogout } from "../api.js";


export async function logout(root) {
    const loader = root.querySelector("#nameSettings .spinner");
    const errMsg = root.querySelector("#errorMsg");
    const localEmail = localStorage.getItem("userEmail");
    const localUserId = localStorage.getItem("userId");

    showLoader(loader);
    const result = await requestLogout();
    if(result.ok) {
        resetStorage();
        clearCsrfToken();
    }

    showMessage(root, result.ok ? "Logout erfolgreich" : "Logout fehlgeschlagen", result.message);
    showInlineNotification(errMsg, result.ok ? "Erfolgreich Ausgeloggt" : "Fehler beim Ausloggen", result.ok ? "info" : "error");

    hideLoader(loader);
    window.location = "./auth.html";
}


export function resetStorage() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
}
