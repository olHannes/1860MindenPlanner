import * as config from "./config.js";
import * as panel from "./panel-handling.js";


import { getCurrentUser } from "./auth/api.js";

export async function requireAuth() {
    const result = await getCurrentUser();
    if(result.ok) {
        setupProfileData(result.user);
    } else {
        localStorage.clear();
        window.location = "./auth.html";
    }
}


function setupProfileData(user) {
    localStorage.setItem("userId", user.id);
    localStorage.setItem("userEmail", user.email);

    document.getElementById("welcomeUser").innerHTML = `Wilkommen <i>${user.firstName}</i>`;
    document.getElementById("firstNameEdit").placeholder = user.firstName;
    document.getElementById("lastNameEdit").placeholder = user.lastName;
    
    document.getElementById("profilePicture").style.filter = `drop-shadow(0px 0px 5px ${user.color})`;

    document.getElementById("visibleCheckbox").checked = user.visibility;
    document.getElementById("autoLoginCheckbox").checked = user.autoLogin;

    const adminSettings = document.getElementById("admin-settings");
    if(adminSettings) adminSettings.hidden = !user.isAdmin;
}

























// startup check and auto login
///////////////////////////////////////////////////////////////////
export async function startup(root) {
    try {
        fetch(`${config.serverURL}/awake`);
    } catch (error) {console.error("On-Startup error:", error);}

    panel.showStartupInformation(root);
}









export async function requestPasswordChange(root) {
    const loader    = root.querySelector("#pwdForgot_mask .spinner");
    const confirm   = root.getElementById("pwdForgotInput-Verify")?.value;
    const password  = root.getElementById("pwdForgotInput-password")?.value;
    const email     = localStorage.getItem("userEmail");

    if(!email) return {message: "Interner Fehler - E-Mail fehlt", returnCode: 1};
    if(!confirm || !password) return {message: "Es muss das Passwort und die Bestätigung eingegeben werden", returnCode: 2};
    if(password.length < 4) return {message: "Das Passwort muss mindestens 4 Zeichen lang sein.", returnCode: 3};

    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/forgot/updatePassword`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, confirm_code: confirm, new_password: password })
        });
        const data = await resp.json();
        if(data.ok) return {message: "Das Passwort wurde erfolgreich geändert", returnCode: 0};
        return {message: data.message ?? "Das Passwort konnte nicht geändert werden", returnCode: 4};

    } catch (error) {
        console.error("Failed to change Password:", error);
        return {message: "Netzwerkfehler", returnCode: 4};
    } finally {
        panel.hideLoader(loader);
    }
}