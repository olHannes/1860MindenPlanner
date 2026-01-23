import * as config from "./config.js";
import * as panel from "./panel-handling.js";

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
    panel.showStartupInformation(root);
}

//helper functions
///////////////////////////////////////////////////////////////////
export function setAutoLogin(autoLogin) {
    localStorage.setItem("autoLogin", autoLogin ? "true" : "false");
}
function normalizeString(txt) {
    if(!txt || txt.length < 1) return;
    return txt
        .trim()              
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}
function resetUserStorage() {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("adminKey");
}
///////////////////////////////////////////////////////////////////

function showInlineNotification(field, text, type) {
    if (!field || !type) return;
    field.textContent = text;
    field.classList.toggle("info", type==="info");
    field.classList.toggle("error", type==="error");
}

export async function register(root) {
    const namePattern = /^[A-Za-zÄÖÜäöüß ]+$/;
    const lineNotification  = root.getElementById("errorMsgRegister");
    let firstNameValue      = root.getElementById("registration-firstName")?.value;
    let lastNameValue       = root.getElementById("registration-lastName")?.value;
    const newPwd            = root.getElementById("newPassword")?.value;
    const confPwd           = root.getElementById("confirmPassword")?.value;

    firstNameValue = normalizeString(firstNameValue);
    lastNameValue = normalizeString(lastNameValue);

    if (newPwd !== confPwd) {
        showInlineNotification(lineNotification, "Passwörter stimmen nicht überein!", "error");
        return;
    }
    if (!firstNameValue || firstNameValue.length < 1 || !lastNameValue || lastNameValue.length < 1 || !newPwd || newPwd.length < 1) {
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
            panel.hideRegistration(root);
            if(!errMsgRegistration || ! errMsg) return;
            showInlineNotification(errMsg, "Nutzer erfolgreich registriert.", "info");
        } else {
            panel.clearForm(root, ["firstName", "lastName", "newPassword", "confirmPassword"], "errorMsgRegister");
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

    if(!username || !pwd) {
        showInlineNotification(errMsg, "Zum Anmelden bitte Benutzername und Passwort eingeben.", "error");
        return;
    }

    //showLoader
    try {
        const resp = await fetch(`${config.serverURL}/account/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: pwd})
        });
        const data = await resp.json();
        //hideLoader

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
            showInlineNotification(errMsg, "Anmeldung erfolgreich!", "info");
            setupProfile(root);
            panel.applyLoginStatus(root);
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

// Request and Render Profile Data (after Login)
///////////////////////////////////////////////////////////////////
export async function setupProfile(root) {
    const localUserId = localStorage.getItem("userId");
    let firstNameContainer = root.getElementById("Vorname");
    let lastNameContainer = root.getElementById("Nachname");
    let welcomeText = root.getElementById("welcomeUser");
    let profileImg_1 = root.getElementById("profilePicture");
    let profileImg_2 = root.getElementById("profilePictureOptions");
    let visibleToggle = root.getElementById("visibleCheckbox");
    let autoLoginToggle = root.getElementById("autoLoginCheckbox");

    if(!localUserId) {
        console.error("keine userId gefunden");
        panel.applyLoginStatus(root);
        return;
    }
    if(!firstNameContainer || !lastNameContainer || !welcomeText || !profileImg_1 || !profileImg_2 || !visibleToggle || !autoLoginToggle) {
        console.error("Setup Profile failed");
        return;
    }

    try {
        //showLoader
        const resp = await fetch(`${config.serverURL}/account/getUserInfo?userId=${localUserId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        if(!resp.ok) throw new Error("Failed to load User:", resp);
        
        const userInfo = await resp.json();
        firstNameContainer.textContent = userInfo.first_name ?? "<not found>";
        lastNameContainer.textContent = userInfo.last_name ?? "<not found>";
        welcomeText.textContent = "Wilkommen " + userInfo.first_name ?? "";
        profileImg_1.style.filter = userInfo.color_code ? `drop-shadow(0px 0px 5px ${userInfo.color_code})` : "";
        profileImg_2.style.filter = userInfo.color_code ? `drop-shadow(0px 0px 5px ${userInfo.color_code})` : "";
        visibleToggle.checked = userInfo.visibility ?? false;
        autoLoginToggle.checked = localStorage.getItem("autoLogin") ?? false;
    } catch (error) {
        console.error("failed to setup Profile:", error);
        localStorage.removeItem("userId");
        localStorage.removeItem("adminKey");
    } finally {
        panel.applyLoginStatus(root);
        //hideLoader
    }
}

//Delete User
export async function deleteUserAccount(root) {
    const informationField = root.getElementById("errorMsg");
    const currentName = localStorage.getItem("user");
    const currentId = localStorage.getItem("userId");

    if (!currentName || !currentId) return;
    //showLoader();
    try {
        const resp = await fetch(`${config.serverURL}/account/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: currentName, userId: currentId})
        });
        if(!resp.ok) throw new Error(`Account löschen fehlgeschlagen: ${resp}`);
        resetUserStorage();
        panel.applyLoginStatus(root);
        //showMessage("Account gelöscht", "Der Account '" + currentName + "' wurde erfolgreich entfernt.");
        panel.hideAccountDeletion(root, true);
        if(informationField) showInlineNotification(informationField, "Der Account wurde erfolgreich gelöscht", "info");
    } catch (error) {
        console.error("Account deletion error:", error);
    } finally {
        //hideLoader();
    }
}

// Logout User
export async function logout(root) {
    const inlineError = root.getElementById("errorMsg");
    const localUsername = localStorage.getItem("user");
    const localUserId = localStorage.getItem("userId");
    if(!localUsername || !localUserId) return;

    //showLoader()
    try {
        const resp = await fetch(`${config.serverURL}/account/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: localUsername, userId: localUserId })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error("Fetch failed.");
        if (data.message === "Erfolgreich ausgeloggt!" || data.message === "Kein Benutzername oder Benutzer-ID angegeben!") {
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            localStorage.removeItem("adminKey");
            showInlineNotification(inlineError, "Erfolgreich abgemeldet.", "info");
        } else {
            showInlineNotification(inlineError, data.message ?? "Unbekannter Fehler beim Ausloggen.", "error");
        }

    } catch (error) {
        console.error("Logout failed:", error);
        showInlineNotification(inlineError, "Failed logout.", "error");
    } finally {
        //hideLoader()
        panel.applyLoginStatus(root);
    }
}