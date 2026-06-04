
import { getCsrfToken } from "../base_api.js";
import * as config from "../config.js";


export async function fetchCompetitionList() {
    let url = `${config.serverURL}/competition/all`;
    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await resp.json();
        console.log("fetchCompetitionList: ", data);
        return data;
    } catch (error) {
        console.error("Failed to load Competition List", error);
        return { ok: false, message: "Wettkämpfe konnten nicht geladen werden" };
    }
}


export async function fetchCompetitionDetails({compId}) {
    if(!compId) return { ok: false, message: "Fehlende Daten für die Wettkampf-Daten" };
    try {
        const resp = await fetch(`${config.serverURL}/competition/${compId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        console.log("fetchCompetitionDetails:", data);
        return data;
    } catch (error) {
        console.error("Failed to load Competition-Details", error);
        return { ok: false, message: "Wettkampf-Daten konnten nicht geladen werden" };
    }
}


export async function fetchCompetitionEntries({compId}) {
    if(!compId) return { ok: false, message: "Fehlende Daten für die Wettkampf-Einträge" };
    try {
        const resp = await fetch(`${config.serverURL}/competition/${compId}/entries`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        console.log("fetchCompetitionEntries: ", data);
        return data;
    } catch (error) {
        console.error("Failed to load Competition-Entries", error);
        return { ok: false, message: "Die Wettkampf-Einträge konnten nicht geladen werden" };
    }
}


export async function fetchCompetitionScores({compId}) {
    if(!compId) return { ok: false, message: "Fehlende Daten für die Wettkampf-Scores" };
    try {
        const resp = await fetch(`${config.serverURL}/competition/${compId}/points`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
        const data = await resp.json();
        console.log("fetchCompetitionScores: ", data);
        return data;
    } catch (error) {
        console.error("Failed to fetchCompetitionScores", error);
        return { ok: false, message: "Wettkampf-Scores konnten nicht geladen werden" };
    }
}


export async function fetchUpdateCompetitionScore({compId, scores}) {
    if(!compId || !scores) return { ok: false, message: "Fehlende Daten für das Score-Update" };
    try {
        const resp = await fetch(`${config.serverURL}/competition/${compId}/points`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            credentials: "include",
            body: JSON.stringify(scores)
        });
        const data = await resp.json();
        console.log("updateCompetitionScore: ", data);
        return data;
    } catch (error) {
        console.error("Failed to update Competition Score", error);
        return { ok: false, message: "Score konnte nicht aktualisiert werden" };
    }
}


export async function joinCompetition({compId}) {
    if(!compId) return { ok: false, message: "Fehlende Daten für den Wettkampf-Beitritt" };
    try {
        const resp = await fetch(`${config.serverURL}/competition/${compId}/join`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            credentials: "include"
        });
        const data = await resp.json();
        console.log("joinCompetition: ", data);
        return data;
    } catch (error) {
        console.error("Failed to join Competition", error);
        return { ok: false, message: "Wettkampf-Beitritt war nicht erfolgreich" };
    }
}


export async function leaveCompetition({compId}) {
    if(!compId) return { ok: false, message: "Fehlende Daten für den Wettkampf-Austritt" };
    try {
        const resp = await fetch(`${config.serverURL}/competition/${compId}/leave`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            credentials: "include"
        });
        const data = await resp.json();
        console.log("leaveCompetition: ", data);
        return data;
    } catch (error) {
        console.error("Failed to leave Competition", error);
        return { ok: false, message: "Wettkampf-Austritt war nicht erfolgreich" };
    }
}