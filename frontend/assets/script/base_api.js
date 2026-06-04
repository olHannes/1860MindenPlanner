import * as config from "./config.js";

let csrfToken = null;


export async function loadCsrfToken() {
    try {
        const resp = await fetch(`${config.serverURL}/csrf`, {
            method: "GET",
            credentials: "include"
        });
        const data = await resp.json();
        if(data.ok) csrfToken = data.csrfToken ?? null;
    } catch (error) {
        console.error("Failed to load csrfToken: ", error);
        return { ok: false, message: "CSRF Token konnte nicht geladen werden - Netzwerkfehler"};
    }
}

export function getCsrfToken() {
    return csrfToken;
}

export function clearCsrfToken() {
    csrfToken = null;
}