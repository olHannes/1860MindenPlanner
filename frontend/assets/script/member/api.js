
import { getCsrfToken } from "../base_api.js";
import * as config from "../config.js";

export async function fetchAllUser() {
    try {
        const resp = await fetch(`${config.serverURL}/users/all`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        console.log("fetchAllUser: ", data);
        return data;
    } catch (error) {
        console.error("Failed to fetch all User", error);
        return { ok: false, message: "Fehler beim laden der Nutzer" };
    }
}


export async function fetchRateRoutine({targetUserId, apparatus, rating}) {
    if(!targetUserId || !apparatus || rating < 0 || rating > 5) return { ok: false, message: "Falsche Eingabewerte" };
    try {
        const resp = await fetch(`${config.serverURL}/routine/rating`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({
                target_userId: targetUserId,
                device: apparatus,
                rating: rating
            }),
            credentials: "include"
        });
        const data = await resp.json();
        console.log("fetchRateRoutine: ", data);
        return data;
    } catch (error) {
        console.error("Failed to rate routine", error);
        return { ok: false, message: "Bewertung konnte nicht gespeichert werden" };
    }
}