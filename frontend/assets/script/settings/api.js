
import { getCsrfToken } from "../base_api.js";
import * as config from "../config.js";

export async function requestNameChange({firstName, lastName}) {
    if(!firstName || !lastName) return { ok: false, message: "Fehlerhafte Eingaben" };

    try {
        const resp = await fetch(`${config.serverURL}/account/change/name`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({
                new_first_name: firstName,
                new_last_name: lastName
            }),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("requestNameChange: ", data);
        return data;
    } catch (error) {
        console.error("Failed to update the user-name", error);
        return { ok: false, message: "Der Name konnte nicht geändert werden." };
    }
}


export async function requestLogout() {
    try {
        const resp = await fetch(`${config.serverURL}/account/logout`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            credentials: "include"
        });
        const data = await resp.json();
        console.log("requestLogout:", data);
        return data;
    } catch (error) {
        console.error("Failed to logout:", error);
        return { ok: false, message: "Logout konnte nicht durchgeführt werden - Netzwerkfehler" };
    }
}


export async function requestAccountDeletion({ password }) {
    if(!password) return { ok: false, message: "Fehlende Daten um den Account zu löschen" };

    try {
        const resp = await fetch(`${config.serverURL}/account/delete`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({ password: password }),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("requestAccountDeletion:", data);
        return data;
    } catch (error) {
        console.error("Failed to delete Account:", error);
        return { ok: false, message: "Account konnte nicht gelöscht werden" };
    }
}



export async function requestEmailRestCode({ email }) {
    if(!email) return { ok: false, message: "E-Mail für den Reset-Code konnte nicht gesendet werden." };

    try {
        const resp = await fetch(`${config.serverURL}/account/passwordReset/request`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({ email: email })
        });
        const data = await resp.json();
        console.log("requestEmailResetCode: ", data);
        return data;
    } catch (error) {
        console.error("Failed to request Email-Code", error);
        return { ok: false, message: "E-Mail für den Passwort Reset konnte nicht gesendet werden." };
    }
}


export async function requestPasswordSubmitChange({ emailConfirm, newPwd }) {
    if(!emailConfirm || !newPwd) return { ok: false, message: "Fehlende Daten für die Passwort-Änderung" };

    try {
        const resp = await fetch(`${config.serverURL}/account/change/password`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({
                confirm_code: emailConfirm,
                new_password: newPwd
            }),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("requestPasswordSubmitChange:", data);
        return data;
    } catch (error) {
        console.error("Failed to submit new Password:", error);
        return { ok: false, message: "Das neue Password konnten nicht gespeichert werden." };
    }
}


export async function requestProfileColorChange({color}) {
    if(!color) return { ok: false, message: "Profilfarbe konnte nicht gespeichert werden." };

    try {
        const resp = await fetch(`${config.serverURL}/account/change/color`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({ colorCode: color }),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("requestProfileColorChange: ", data);
        return data;
    } catch (error) {
        console.error("Failed to update Profile-Color:", error);
        return { ok: false, message: "Die Profilfarbe konnte nicht geändert werden." };
    }
}


export async function requestVisibilityChange({visible}) {
    try {
        const resp = await fetch(`${config.serverURL}/account/change/visibility`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({ visibility: visible }),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("requestVisibilityChange: ", data);
        return data;
    } catch (error) {
        console.error("Failed to toggle Visibility:", error);
        return { ok: false, message: "Sichtbarkeit konnte nicht geändert werden - Netzwerkfehler." };
    }
}


export async function requestAutoLoginChange({remember}) {
    try {
        const resp = await fetch(`${config.serverURL}/account/change/autoLogin`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({ remember }),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("requestAutoLoginChange: ", data);
        return data;
    } catch (error) {
        console.error("Failed to toggle autoLogin", error);
        return { ok: false, message: "Automatischer Login konnte nicht geändert werden - Netzwerkfehler." };
    }
}


export async function requestSubmitReport({ reportType, reportTitle, report }) {
    if(!reportType || !reportTitle || !report) return { ok: false, message: "Fehlende Eingaben für einen gültigen Report" };

    try {
        const resp = await fetch(`${config.serverURL}/report/issue`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({
                type: reportType,
                title: reportTitle,
                body: report
            }),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("requestSubmitReport: ", data);
        return data;
    } catch (error) {
        console.error("Failed to submit a new report", error);
        return { ok: false, message: "Report konnte nicht angelegt werden." };
    }
}


export async function requestExistingReports() {
    try {
        const resp = await fetch(`${config.serverURL}/report/all`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        console.log("requestExistingReports: ", data);
        return data;
    } catch (error) {
        console.error("Failed to request the reports", error);
        return { ok: false, message: "Reports konnten nicht geladen werden" };
    }
}