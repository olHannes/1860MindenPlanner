import { serverURL } from "../config.js";
import { clearHTML, hideLoader, showInlineNotification, showLoader, showMessage } from "../panel-handling.js";
import { requestNewPassword, sendResetEMail } from "./api.js";
import { isValidEmail } from "./registration.js";
import { showLogin } from "./views.js";


export async function handlePasswordForgotRequest(event) {
    event.preventDefault();

    const form = event.target.closest("form") ?? document.querySelector("#pwdForgotEmailForm");
    if(!form) return;

    const loader = form.querySelector(".spinner");
    const page1 = document.querySelector("#pwdForgot-page-1");
    const page2 = document.querySelector("#pwdForgot-page-2");
    const errorEl = document.querySelector("#pwdForgotErr");
    
    clearHTML(errorEl);

    const formData = new FormData(form);
    const email = formData.get("email")?.trim() ?? "";

    if(!isValidEmail(email)) {
        showInlineNotification(errorEl, "Es muss eine gültige E-Mail angegeben werden", "error");
        return;
    }
    showLoader(loader);
    const result = await sendResetEMail(email);
    showInlineNotification(errorEl,
        result.message,
        result.ok ? "info": "error"
    );
    hideLoader(loader);
    if(!result.ok) return;

    localStorage.setItem("request_email", email);
    console.log(localStorage);
    form.reset();
    page1.hidden = true;
    page2.hidden = false;
}


export async function requestPasswordReset(event) {
    event.preventDefault();

    const form = event.target.closest("form") ?? document.querySelector("#pwdForgotResetForm");
    if(!form) return;

    const loader = form.querySelector(".spinner");
    const errorEl = document.querySelector("#pwdForgotErr");
    
    clearHTML(errorEl);

    const formData = new FormData(form);
    const authCode = formData.get("verificationCode");
    const newPwd = formData.get("newPassword");
    const email = localStorage.getItem("request_email");

    if(!authCode) {
        showInlineNotification(errorEl, "Der Authentifizierungscode muss gültig sein.", "error");
        return;
    }
    if(!newPwd) {
        showInlineNotification(errorEl, "Es muss ein neues Passwort angegeben werden.", "error");
        return;
    }
    showLoader(loader);
    const result = await requestNewPassword(email, newPwd, authCode);
    showInlineNotification(
        errorEl,
        result.message,
        result.ok ? "info" : "error"
    );
    showMessage(document, result.message, result.ok ? "Passwort zurückgesetzt" : "Passwort konnte nicht zurückgesetzt werden");
    hideLoader(loader);
    if(result.ok) {
        localStorage.clear();
        showLogin();
    }
}