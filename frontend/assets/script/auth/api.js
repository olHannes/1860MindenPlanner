
import { serverURL } from "../config.js";

export async function registerUser({firstName, lastName, email, password}) {
    try {
        const resp = await fetch(`${serverURL}/account/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, password})
        });
        const data = await resp.json();
        return data;
    } catch (error) {
        console.error("Failed to register User:", error);
        return { ok: false, message: "Nutzer konnte nicht registriert werden - Netzwerkfehler."};
    }
}

export async function loginUser({email, password, remember}) {
    try {
        const resp = await fetch(`${serverURL}/account/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password, remember })
        });
        const data = await resp.json();
        return data;
    } catch (error) {
        console.error("Failed to login:", error);
        return { ok: false, message: "Login war nicht erfolgreich - Netzwerkfehler" };
    }
}

export async function getCurrentUser() {
    try {
        const resp = await fetch(`${serverURL}/account/me`, {
            method: "GET",
            credentials: "include",
            redirect: "manual",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
        const data = await resp.json();
        return data;
    } catch (error) {
        console.error("Failed to get current user:", error);
        return { ok: false, message: "Nutzer nicht gefunden - Netzwerkfehler" };
    }
}

export async function sendResetEMail(email) {
    try {
        const resp = await fetch(`${serverURL}/account/passwordReset/request`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email})
        });
        const data = await resp.json();
        return data;
    } catch (error) {
        console.error("Failed to send request-password-email");
        return {ok: false, message: "Die E-Mail konnte nicht versendet werden."};
    }
}
