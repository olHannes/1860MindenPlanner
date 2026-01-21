import * as config from "./config.js";

// startup check and auto login
///////////////////////////////////////////////////////////////////
export async function startup(root) {
    try {
        fetch(`${config.serverURL}/awake`);
    } catch (error) {console.error("On-Startup error:", error);}

    if (localStorage.getItem("autoLogin") != 'true') {
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
    }
    if (localStorage.getItem("user") == "admin") {
        localStorage.removeItem("adminKey");
        localStorage.removeItem("user");
    }

    showStartupInformation(root);
}


function showStartupInformation(root) {
    const startupPanel = root.getElementById("startupInformation");
    if(startupPanel) {
        startupPanel.style.display = localStorage.getItem("startUpInfo") ? "none" : "flex";
    }
}

//helper functions
///////////////////////////////////////////////////////////////////
function clearForm(root, inputIds = [], errorId = null) {
    if (!root) return;
    inputIds.forEach(id => {
        const el = root.getElementById(id);
        if (el && "value" in el) {
            el.value = "";
        }
    });
    if (errorId) {
        const errorEl = root.getElementById(errorId);
        if (errorEl) errorEl.textContent = "";
    }
}
export function setAutoLogin(autoLogin) {
    localStorage.setItem("autoLogin", autoLogin ? "true" : "false");
}
function normalizeString(txt) {
    return txt
        .trim()              
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}
///////////////////////////////////////////////////////////////////

// User Registration
///////////////////////////////////////////////////////////////////
//handle registration windows
export function showRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    if(!loginMask || !registrationMask) return;
    clearForm(root, ["firstName", "lastName", "newPassword", "confirmPassword"], "errorMsgRegister");
    loginMask.style.display = "none";
    registrationMask.style.display = "block";
}
export function hideRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    if(!loginMask || !registrationMask) return;
    clearForm(root, ["username", "password"], "errorMsg");
    registrationMask.style.display = "none";
    loginMask.style.display = "block";
}


function showInlineNotification(field, text, type) {
    if (!field || !text || !type) return;
    field.textContent = text;
    field.classList.toggle("info", type==="info");
    field.classList.toggle("error", type==="error");
}

export async function register(root) {
    const namePattern = /^[A-Za-zÄÖÜäöüß ]+$/;
    const lineNotification  = root.getElementById("errorMsgRegister");
    let firstNameValue      = root.getElementById("firstName")?.value;
    let lastNameValue       = root.getElementById("lastName")?.value;
    const newPwd            = root.getElementById("newPassword")?.value;
    const confPwd           = root.getElementById("confirmPassword")?.value;

    firstNameValue = normalizeString(firstNameValue);
    lastNameValue = normalizeString(lastNameValue);

    if (newPwd !== confPwd) {
        showInlineNotification(lineNotification, "Passwörter stimmen nicht überein!", "error");
        return;
    }
    if (firstNameValue.trim().length < 1 || lastNameValue.trim().length < 1 || newPwd.trim().length < 1) {
        showInlineNotification(lineNotification, "Alle Felder müssen ausgefüllt sein!", "error");
        return;
    }
    if (!namePattern.test(firstNameValue)) {
        showInlineNotification(lineNotification, "Der Vorname darf nur Buchstaben enthalten!", "error");
        return;
    }
    if (!namePattern.test(lastNameValue)) {
        showInlineNotification(lineNotification, "Der Nachname darf nur Buchstaben enthalten!", "error");
        return;
    }

    const errMsgRegistration = root.getElementById("errorMsgRegister");
    const errMsg = root.getElementById("errorMsg");
    try {
        //show Loader
        const resp = await fetch(`${config.serverURL}/account/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName: firstNameValue, lastName: lastNameValue, password: newPwd })
        });
        const data = await resp.json();
        if (resp.ok && data.message === "Registrierung erfolgreich!") {
            hideRegistration(root);
            if(!errMsgRegistration || ! errMsg) return;
            showInlineNotification(errMsg, "Nutzer erfolgreich registriert.", "info");
        } else {
            clearForm(root, ["firstName", "lastName", "newPassword", "confirmPassword"], "errorMsgRegister");
            showInlineNotification(errMsgRegistration, "Registrierung fehlgeschlagen - Benutzername bereits vergeben!", "error");
        }
    } catch (error) {
        console.error("Registration error:", error);
        showInlineNotification(errMsgRegistration, "Ein Netzwerkfehler ist augetreten!", "error");
    } finally {
        //hide loader
    }
}

// User Login
///////////////////////////////////////////////////////////////////
export async function login(root) {
    const errMsg = root.getElementById("errorMsg");

    let username = root.getElementById("username")?.value;
    let pwd = root.getElementById("password")?.value;
    username = normalizeString(username);

    //showLoader
    try {
        const resp = await fetch(`${config.serverURL}/account/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: pwd})
        });
        const data = await resp.json();
        //hideLoader
        console.log(data);

        if(resp.ok && username === "Admin") {
            localStorage.setItem("user", username);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("adminKey", data.adminKey);
            localStorage.removeItem("autoLogin");
            //loadAdminReports();
            return;
        }

        if (resp.ok && data.message === "Login erfolgreich!") {
            localStorage.setItem("user", username);
            localStorage.setItem("userId", data.userId);
            //setProfileName();
            //checkLoginStatus();
            //loadMaxPoints();
        } else if (resp.status === 403) {
            showInlineNotification(errMsg, "Benutzer bereits auf einem anderen Gerät eingeloggt.", "error");
        } else {
            showInlineNotification(errMsg, "Ungültige Kombination aus Benutzername und Passwort!", "error");
        }
    } catch (error) {
        console.error("Login error:", error);
        showInlineNotification(errMsg, "Ein Netzwerkfehler ist aufgetreten!", "error");
        //showNameError
    } finally {
        //hideLoader
    }
}