
import { clearHTML, clearValue, hide, hideFloatingBackground, hideLoader, show, showFloatingBackground, showLoader, showMessage } from "../../panel-handling.js";
import { requestAutoLoginChange, requestEmailRestCode, requestPasswordSubmitChange } from "../api.js";

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


export function bindSecurityEvents(root) {
    const container = root.querySelector("#passwordReset");
        container?.addEventListener("click", (e) => {
            const target = e.target.closest("[data-action]");
            if(!target) return;
    
            const action = target.dataset.action;
    
            console.log("action: ", action);
            
            if(action === "cancel-pwd-reset") {
                hidePasswordView(root);

            } else if(action === "request-email-reset-code") {
                resetUserPassword(root);
            
            } else if(action === "update-account-pwd") {
                updatePassword(root);

            }
        });
}


export function showPasswordView(root) {
    if(!root) return;
    const errMsg    = root.querySelector("#pwMsg");
    clearValue(root.querySelector("#pwCode"));
    clearValue(root.querySelector("#pwNew"));
    clearHTML(errMsg);

    errMsg.classList.toggle("info", false);
    errMsg.classList.toggle("error", false);
    root.querySelector("#sendResetCodeBtn").innerText = "Code per E-Mail senden";
    root.querySelector("#cancelPwResetBtn").innerText = "Abbrechen";
    
    showFloatingBackground(root);
    show(root.querySelector("#passwordReset"), "block");
}


export function hidePasswordView(root) {
    if(!root) return;
    hide(root.querySelector("#passwordReset"));
    hideFloatingBackground(root);
}


export async function resetUserPassword(root) {
    const email = localStorage.getItem("userEmail");
    const loader = root.querySelector("#passwordReset .spinner");
    const errMsg = root.querySelector("#pwMsg");
    const btn = root.querySelector("#sendResetCodeBtn");
    btn.disabled = true;

    showLoader(loader);
    const result = await requestEmailRestCode({email: email});

    errMsg.innerText = result.message ?? "Die E-Mail konnte nicht gesendet werden";
    errMsg.classList.toggle("info", result.ok == true);
    errMsg.classList.toggle("error", result.ok != true);
    
    hideLoader(loader);
    setTimeout(() => {
        btn.disabled = false;
    }, 5000);
}


export async function updatePassword(root) {
    const loader        = root.querySelector("#passwordReset .spinner");
    const errMsg        = root.querySelector("#pwMsg");
    const emailConfirm  = root.querySelector("#pwCode")?.value;
    const newPwd        = root.querySelector("#pwNew")?.value;

    showLoader(loader);
    const result = await requestPasswordSubmitChange({
        emailConfirm: emailConfirm,
        newPwd: newPwd
    });

    errMsg.innerText = result.message;
    errMsg.classList.toggle("info", result.ok == true);
    errMsg.classList.toggle("error", result.ok != true);
    showMessage(root, result.ok ? "Passwort wurde erfolgreich geändert" : "Passwort konnte nicht geändert werden", result.message);
    hideLoader(loader);
}


export async function toggleAutoLogin(root, autoLogin) {
    const result = await requestAutoLoginChange({ remember: autoLogin });
    showMessage(root, result.ok ? "Login wurde gespeichert" : "Automatischer Login konnte nicht gespeichert werden", result.message);    
}