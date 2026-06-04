import { clearHTML, hideLoader, showLoader, showInlineNotification, showMessage } from "../panel-handling.js";
import { loginUser } from "./api.js";
import { isValidEmail } from "./registration.js";

import { getCurrentUser } from "./api.js";
import { loadCsrfToken } from "../base_api.js";


export async function handleAutoLogin() {
    const result = await getCurrentUser();
    if(result.ok) window.location = "./index.html";
}

export async function handleLogin(event) {
    event.preventDefault();

    const form = event.target.closest("form") ?? document.querySelector("#loginForm");
    if(!form) return;

    const panel = form.closest("#login_mask");
    const loader = panel?.querySelector(".spinner");
    const errorBox = form.querySelector("#errorMsg");
    clearHTML(errorBox);

    const data = getLoginData(form);
    const validationErrors = validateLoginData(data);

    if(validationErrors.length > 0) {
        showInlineNotification(errorBox, validationErrors[0], "error");
        return;
    }
    showLoader(loader);
    const result = await loginUser({
        email: data.email,
        password: data.password,
        remember: data.remember
    });
    showInlineNotification(errorBox, result.message, result.ok ? "info" : "error");
    hideLoader(loader);
    if(!result.ok) return;
    form.reset();
    window.location.href = "./index.html";
}

function getLoginData(form) {
    const formData = new FormData(form);
    return {
        email: formData.get("email")?.trim() ?? "",
        password: formData.get("password") ?? "",
        remember: formData.get("stayLoggedIn") ? true : false,
    };
}
function validateLoginData(data) {
    const errors = [];
    if(!data.email) errors.push("E-Mail muss ausgefüllt sein");
    if(!isValidEmail(data.email)) errors.push("Bitte eine gültige E-Mail angeben.");
    if(!data.password) errors.push("Bitte Passwort eingeben");
    return errors;
}