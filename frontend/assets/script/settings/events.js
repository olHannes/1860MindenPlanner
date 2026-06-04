import { show, clearValue, clearHTML, showFloatingBackground } from "../panel-handling.js";
import { showAccountDeletionView } from "./views/view-account-deletion-settings.js";
import { changeProfileColor } from "./views/view-color-settings.js";
import { logout } from "./views/view-logout.js";
import { showNameView, toggleVisibility } from "./views/view-profile-settings.js";
import { showReportView } from "./views/view-report-settings.js";
import { showPasswordView, toggleAutoLogin } from "./views/view-security-settings.js";



export function bindSettingEvents(root) {

    const container = root.querySelector("#panel4");
    container?.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;

        console.log("action: ", action);

        if(action === "change-name-view") {
            showNameView(root);
        
        } else if(action === "toggle-visibility") {
            const visibility = root.querySelector("#visibleCheckbox")?.checked;
            toggleVisibility(root, visibility);
        
        } else if(action === "change-pwd-view") {
            showPasswordView(root);
        
        } else if(action === "toggle-auto-login") {
            const autoLogin = root.querySelector("#autoLoginCheckbox")?.checked;
            toggleAutoLogin(root, autoLogin);
        
        } else if(action === "change-color") {
            const color = target.dataset.color;
            changeProfileColor(root, color);
        
        } else if(action === "feedback-view") {
            showReportView(root);
        
        } else if(action === "account-logout") {
            logout(root);
        
        } else if(action === "account-delete-view") {
            showAccountDeletionView(root);
        
        }
    });
}