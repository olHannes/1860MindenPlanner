import { clearHTML, hideLoader, showInlineNotification, showLoader } from "../panel-handling.js";
import { sendResetEMail } from "./api.js";
import { isValidEmail } from "./registration.js";


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

    form.reset();
    page1.hidden = true;
    page2.hidden = false;
}