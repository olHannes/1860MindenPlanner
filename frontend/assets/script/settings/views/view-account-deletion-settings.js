import { clearHTML, clearValue, hide, hideFloatingBackground, hideLoader, show, showFloatingBackground, showInlineNotification, showLoader, showMessage } from "../../panel-handling.js";
import { requestAccountDeletion } from "../api.js";
import { resetStorage } from "./view-logout.js";

export function bindAccountDeletionEvents(root) {

    const form = root.querySelector("#requestDelAcc");
    if(!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        deleteAccount(root);
    });

    form.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;
        console.log(action);
        
        if(action === "cancel-account-deletion") {
            hideAccountDeletionView(root);
        }
    });
}


export function showAccountDeletionView(root) {
    if(!root) return;
    const errMsg = root.querySelector("#deleteErr");
    if(errMsg) {
        errMsg.classList.toggle("info", false);
        errMsg.classList.toggle("error", false);
    }
    clearHTML(errMsg);
    clearValue(root.querySelector("#deleteAccountPwd"));
    
    showFloatingBackground(root);
    show(root.querySelector("#requestDelAcc"), "block");
    show(root.querySelector("#loadingBackground"), "block");
}

export function hideAccountDeletionView(root) {
    if(!root) return;
    hideFloatingBackground(root);
    hide(root.querySelector("#requestDelAcc"));
    hide(root.querySelector("#loadingBackground"));
}



export async function deleteAccount(root) {
    const loader = root.querySelector("#requestDelAcc .spinner");
    const errMsg = root.querySelector("#deleteErr");

    const pwd = root.querySelector("#deleteAccountPwd")?.value ?? "";

    showLoader(loader);
    const result = await requestAccountDeletion({ password: pwd });
    if(result.ok) resetStorage();

    showMessage(root, result.ok ? "Der Account wurde gelöscht" : "Der Account konnte nicht gelöscht werden", result.message);
    showInlineNotification(errMsg, result.ok ? "Account erfolgreich gelöscht" : "Account wurde nicht gelöscht", result.ok ? "info" : "error");
    hideLoader(loader);

    if(result.ok) {
        hideAccountDeletionView(root);
        window.location = "./auth.html";
    }
}