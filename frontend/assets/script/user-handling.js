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
export function setAutoLogin(root, autoLogin) {
    localStorage.setItem("autoLogin", autoLogin ? "true" : "false");
    panel.showMessage(root, "Automatischer Login", `Der Automatische Login wurde '${autoLogin ? "An": "Aus"}' geschaltet`);
}

function resetUserStorage() {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("adminKey");
}

function setUsernameElements(root, firstName, lastName, color, visible, autoLogin) {
    firstName = firstName ?? "<not found>";
    lastName = lastName ?? "<not found>";
    const firstNameInput        = root.getElementById("firstNameEdit");
    const lastNameInput         = root.getElementById("lastNameEdit");
    const firstNameProfile      = root.getElementById("userVorname");
    const lastNameProfile       = root.getElementById("userNachname");
    const welcomeUser           = root.getElementById("welcomeUser");

    const profileImg_1 = root.getElementById("profilePicture");
    const visibleToggle = root.getElementById("visibleCheckbox");
    const autoLoginToggle = root.getElementById("autoLoginCheckbox");
    
    if(firstNameInput)      firstNameInput.placeholder = firstName;
    if(lastNameInput)       lastNameInput.placeholder = lastName;
    if(firstNameProfile)    firstNameProfile.innerText = firstName;
    if(lastNameProfile)     lastNameProfile.innerText = lastName;
    if(welcomeUser)         welcomeUser.innerHTML = `Wilkommen <i>${firstName}</i>`;

    if(profileImg_1)        profileImg_1.style.filter = `drop-shadow(0px 0px 5px ${color})`;
    if(visibleToggle)       visibleToggle.checked = visible;
    if(autoLoginToggle)     autoLoginToggle.checked = autoLogin;
}

function showInlineNotification(field, text, type) {
    if (!field || !type) return;
    field.textContent = text;
    field.classList.toggle("info", type==="info");
    field.classList.toggle("error", type==="error");
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

//User Registration
///////////////////////////////////////////////////////////////////
export async function register(root) {
    const loader                = root.querySelector("#registration_mask .spinner");
    const lineNotification      = root.getElementById("errorMsgRegister");
    let firstNameValue          = root.getElementById("registration-firstName")?.value;
    let lastNameValue           = root.getElementById("registration-lastName")?.value;
    let email                   = root.getElementById("registration-email")?.value;
    const newPwd                = root.getElementById("newPassword")?.value;
    const confPwd               = root.getElementById("confirmPassword")?.value;
    const errMsgRegistration    = root.getElementById("errorMsgRegister");
    const errMsg                = root.getElementById("errorMsg");

    if (!errMsgRegistration || !errMsg) return;

    if (!firstNameValue || firstNameValue.length < 1 || !lastNameValue || lastNameValue.length < 1 || !newPwd || newPwd.length < 1 || !email || email.length < 1) {
        showInlineNotification(lineNotification, "Alle Felder müssen ausgefüllt sein!", "error");
        return;
    }
    if (newPwd !== confPwd) {
        showInlineNotification(lineNotification, "Passwörter stimmen nicht überein!", "error");
        return;
    }
    if (!isValidEmail(email)) {
        showInlineNotification(lineNotification, "Bitte eine gültige E-Mail eingeben!", "error");
        return;
    }

    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName: firstNameValue, lastName: lastNameValue, email: email, password: newPwd })
        });
        
        if(resp.ok) {
            showInlineNotification(errMsg, "Nutzer erfolgreich registriert. Bitte Account mit Bestätigungs-Mail freischalten", "info");
            panel.hideRegistration(root);
            return;
        }
        const data = await resp.json();
        showInlineNotification(errMsgRegistration, data.message || "Registrierung fehlgeschlagen!", "error");
        if(data.errors?.firstName) showInlineNotification(errMsgRegistration, data.errors.firstName, "error");
        if(data.errors?.lastName) showInlineNotification(errMsgRegistration, data.errors.lastName, "error");
        if(data.errors?.password) showInlineNotification(errMsgRegistration, data.errors.password, "error");
        if(data.errors?.email) showInlineNotification(errMsgRegistration, data.errors.email, "error");

    } catch (error) {
        console.error("Registration error:", error);
        showInlineNotification(errMsgRegistration, "Ein Netzwerkfehler ist augetreten!", "error");
    } finally {
        panel.hideLoader(loader);
    }
}


// User Login
///////////////////////////////////////////////////////////////////
export async function login(root) {
    const loader    = root.querySelector("#login_mask .spinner");
    const errMsg    = root.getElementById("errorMsg");
    let email       = root.getElementById("login-email")?.value;
    let pwd         = root.getElementById("password")?.value;
    
    if(!errMsg) return;
    if(!email || !pwd) {
        showInlineNotification(errMsg, "Zum Anmelden bitte E-Mail und Passwort eingeben.", "error");
        return;
    }
    if(!isValidEmail(email)) {
        showInlineNotification(errMsg, "Zur Anmeldung bitte eine gültige E-Mail eingeben.", "error");
        return;
    }
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email: email, 
                password: pwd
            })
        });
        const data = await resp.json();
        if(resp.ok && data.ok) {
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("userEmail", email);
            localStorage.setItem("isAdmin", data.isAdmin);

            showInlineNotification(errMsg, "Anmeldung erfolgreich!", "info");
            if(data.isAdmin) {
                localStorage.setItem("adminKey", data.adminKey);
                localStorage.removeItem("autoLogin");
                //handleAdminLogin();
                return;
            } else {
                setupProfile(root);
                panel.applyLoginStatus(root);
                //loadMaxPoints();
                return;
            }
        }
        showInlineNotification(errMsg, data.message || "Anmeldung fehlgeschlagen!", "error");
        if(data.errors?.email) showInlineNotification(errMsg, data.errors.email, "error");
        if(data.errors?.password) showInlineNotification(errMsg, data.errors.password, "error");
    } catch (error) {
        console.error("Login error:", error);
        showInlineNotification(errMsg, "Ein Netzwerkfehler ist aufgetreten!", "error");
        //showNameError
    } finally {
        panel.hideLoader(loader);
    }
}


// Request and Render Profile Data (after Login)
///////////////////////////////////////////////////////////////////
export async function setupProfile(root) {
    const localUserId = localStorage.getItem("userId");
    const localUserEmail = localStorage.getItem("userEmail");

    if(!localUserId || !localUserEmail) {
        panel.applyLoginStatus(root);
        return false;
    }
    try {
        //showLoader
        const resp = await fetch(`${config.serverURL}/account/info?requestId=${localUserId}&userId=${localUserId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        if(!resp.ok) throw new Error("Failed to load User:", resp);
        
        let firstName   = data.first_name;
        let lastName    = data.last_name;
        let color       = data.color_code ?? "";
        let visible     = data.visibility ?? false;
        let autoLogin   = localStorage.getItem("autoLogin") ?? false;
        setUsernameElements(root, firstName, lastName, color, visible, autoLogin);
        return true;
    } catch (error) {
        console.error("Profile-Setup failed:", error);
        localStorage.removeItem("userId");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("adminKey");
        return false;
    } finally {
        panel.applyLoginStatus(root);
        //hideLoader
    }
}

//Delete User
export async function deleteUserAccount(root) {
    const informationField  = root.getElementById("errorMsg");
    const pwdInput          = root.getElementById("deleteAccountPwd");
    const loader            = root.querySelector("#requestDelAcc .spinner");
    const currentId         = localStorage.getItem("userId");
    const pwd               = pwdInput?.value ?? "";

    if(!informationField || !pwdInput || !currentId) {
        panel.hideAccountDeletion(root, true);
        return {message: "Es ist ein Fehler aufgetreten", returnCode: 1};
    }
    if(!pwd) return {message: "Es muss ein Passwort eingegeben werden", returnCode: 2};
    if(pwd.length < 4) return {message: "Das Passwort muss mindestens 4 Zeichen lang sein", returnCode: 3};
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentId, password: pwd })
        });
        const data = await resp.json();
        if(data.ok) {
            resetUserStorage();
            panel.hideAccountDeletion(root, true);
            panel.applyLoginStatus(root);
            panel.showMessage(root, "Account gelöscht", `Der Account '${data.username}' wurde gelöscht`);
            showInlineNotification(informationField, "Der Account wurde erfolgreich gelöscht", "info");
            return;
        }
        return {message: data.message ?? "Der Account konnte nicht gelöscht werden", returnCode: 4};
    } catch (error) {
        console.error("Account deletion error:", error);
    } finally {
        panel.hideLoader(loader);
    }
}


// Logout User
export async function logout(root) {
    const loader        = root.querySelector("#nameSettings .spinner");
    const inlineError   = root.getElementById("errorMsg");
    const localEmail    = localStorage.getItem("userEmail");
    const localUserId   = localStorage.getItem("userId");
    if(!localEmail || !localUserId) {
        resetUserStorage();
        panel.applyLoginStatus(root);
        return;
    }
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: localEmail, userId: localUserId })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error("Fetch failed.");
        if (data.message === "Erfolgreich ausgeloggt!" || data.message === "Kein Benutzername oder Benutzer-ID angegeben!") {
            resetUserStorage();
            showInlineNotification(inlineError, "Erfolgreich abgemeldet.", "info");
        } else {
            showInlineNotification(inlineError, data.message ?? "Unbekannter Fehler beim Ausloggen.", "error");
        }
    } catch (error) {
        console.error("Logout failed:", error);
        panel.showMessage(root, "Abmeldung fehlgeschlagen", "Account konnte nicht abgemeldet werden");
    } finally {
        panel.hideLoader(loader);
        panel.applyLoginStatus(root);
    }
}

//Change User-Name
export async function submitNameChange(root) {
    const loader        = root.querySelector("#nameSettings .spinner");
    const firstNameEl   = root.getElementById("firstNameEdit");
    const lastNameEl    = root.getElementById("lastNameEdit");
    const userId        = localStorage.getItem("userId");

    let firstNameInput =
        firstNameEl && firstNameEl.value.length > 0
            ? firstNameEl.value
            : firstNameEl?.placeholder;

    let lastNameInput =
        lastNameEl && lastNameEl.value.length > 0
            ? lastNameEl.value
            : lastNameEl?.placeholder;
    if(!userId) {
        return {message: "Interner Fehler - Nutzer nicht gefunden", returnCode: 1};
    }
    if(!firstNameInput || !lastNameInput || firstNameInput.length < 4 || lastNameInput.length < 4) {
        return {message: "Vor- und Nachname muss mindestens 4 Zeichen enthalten", returnCode: 2};
    }
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/change/name`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, new_first_name: firstNameInput, new_last_name: lastNameInput })
        });
        const data = await resp.json();
        if(!data.ok) return {message: data.message ?? "Die Namensänderung war fehlerhaft", returnCode: 3};
        else {
            localStorage.setItem("user", data.new_first_name);
            if(setupProfile(root)) {
                panel.showMessage(root, "Name erfolgreich geändert", `Der neue Nutzername '${firstNameInput} ${lastNameInput}' wurde übernommen.`);
            }
            return {message: data.message ?? "Die Namensänderung war erfolgreich", returnCode: 0};
        }
    } catch (error) {
        console.error("Failed to save new Username:", error);
        return {message: "Netzwerkfehler beim Ändern des Namens", returnCode: 4};
    } finally {
        panel.hideLoader(loader);
    }
}


//Change User-Password
///////////////////////////////////////////////////////////////////
export async function sendResetCode(email, loader) {
    if(!email) return {message: "E-Mail ist nicht vorhanden!", returnCode: 1};
    if(!isValidEmail(email)) return {message: "Es muss eine gültige E-Mail eingetragen werden!", returnCode: 2};
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/passwordReset/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        });
        const data = await resp.json();
        if(data.ok) return {message: "E-Mail wurde erfolgreich versendet.", returnCode: 0};
        return {message: data.message ?? "Fehler beim Senden der E-Mail", returnCode: 3};
    } catch (error) {
        console.error("Failed to send Reset Code:", error);
        return {message: "Netzwerkfehler", returnCode: 4};
    } finally {
        panel.hideLoader(loader);
    }
}
export async function submitPasswordChange(root) {
    const loader        = root.querySelector("#passwordReset .spinner");
    const userId        = localStorage.getItem("userId");
    const emailConfirm  = root.getElementById("pwCode")?.value;
    const newPwd        = root.getElementById("pwNew")?.value;
    
    if(!userId) return {message: "Interner Fehler - fehldende User-ID", returnCode: 1};
    if(!emailConfirm || !newPwd) return {message: "E-Mail Code und Passwort muss eingegeben werden", returnCode: 2};
    
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/change/password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, confirm_code: emailConfirm, new_password: newPwd })
        });
        const data = await resp.json();
        if(!data.ok) return {message: data.message ?? "Passwortänderung konnte nicht übernommen werden", returnCode: 3};
        return {message: data.message ?? "Das Passwort konnte erfolgreich geändert werden", returnCode: 0};
    } catch (error) {
        console.error("Failed to change Password:", error);
        return {message: "Netzwerkfehler", returnCode: 4};
    } finally {
        panel.hideLoader(loader);
    }
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