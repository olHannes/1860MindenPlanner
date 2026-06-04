
import { getCsrfToken } from "../base_api.js";
import * as config from "../config.js";
import { showMessage } from "../panel-handling.js";
import { state } from "./state.js";


export async function fetchExercise({ userId, apparatusId, routineType }) {
    if(!userId || !apparatusId) return { message: "Übung konnte nicht geladen werden", ok: false };

    let url = `${config.serverURL}/routine`
        + `?userId=${userId}`
        + `&apparatus=${apparatusId}`
        + `&type=${routineType}`
        + `&expand=elements`
        + `&include=autoRating`;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        console.log("fetchExercise: ", data);
        return data;
    } catch (error) {
        console.error("Failed to load Exercise: ", error);
        return { message: "Übung konnte nicht geladen werden", ok: false };
    }
}


export async function saveExercise({ apparatusId, elements, routineType }) {
    if(!apparatusId) return { message: "Übung konnte nicht gespeichert werden", ok: false };

    const elementeIDs = elements.map(el => el.id);
    try {
        const res = await fetch(`${config.serverURL}/routine`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({
                "apparatus": apparatusId,
                "elements": elementeIDs,
                "routineType": routineType
            }),
            credentials: "include"
        });
        const data = await res.json();
        console.log("saveExercise: ", data);
        if(data.ok) {
            state.routine.saved = true;
            showMessage(document, "Übung gespeichert", "Die Übung wurde aktualisiert...");
        } else {
            showMessage(document, "Übung nicht gespeichert werden", "Es gab einen Fehler biem speichern der Übung");
        }
        return data;
    } catch (error) {
        console.error("Failed to save Exercise: ", error);
        return { message: "Übung konnte nicht gespeichert werden", ok: false };
    }
}


export async function fetchFilteredElementList({ apparatusId, filter, userId }) {
    if(!apparatusId || !filter || !userId) return { message: "Elemente konnten nicht geladen werden", ok: false };
    
    const params = new URLSearchParams();
    params.set("device", apparatusId);
    params.set("userId", userId);

    if(filter.difficulty) params.set("difficulty", filter.difficulty);
    if(filter.group) params.set("group", filter.group);
    if(filter.learned !== undefined && filter.learned !== null) {
        params.set("learned", String(filter.learned));
    }
    if(filter.search?.trim()) params.set("search", filter.search.trim());

    const url = `${config.serverURL}/exercise/elements?${params.toString()}`;
    
    try {
        const res = await fetch(url, {method: "GET"});
        const data = await res.json();
        console.log("fetchFilteredElementList: ", data);    
        return data;
    } catch (error) {
        console.error("Failed to load filtered-element-list: ", error);
        return { message: "Elemente konnten nicht geladen werden", ok: false };
    }
}


export async function markElementAsLearned({ elementId }) {
    if(!elementId) return { message: "Elemente-Status konnte nicht geändert werden.", ok: false };

    try {
        const res = await fetch(`${config.serverURL}/account/elements/learned/add`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({
                "elementCode": elementId
            }),
            credentials: "include"
        });
        const data = await res.json();
        console.log("markElementAsLearned: ", data);
        return data;
    } catch (error) {
        console.error("Failed to mark learned Element: ", error);
        return { message: "Element konnte nicht als 'gelernt' gespeichert werden", ok: false };
    }
}


export async function removeLearnedElement({ elementId }) {
    if(!elementId) return { message: "Elemente-Status konnte nicht geändert werden.", ok: false };

    try {
        const res = await fetch(`${config.serverURL}/account/elements/learned/remove`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-CSRF-Token": getCsrfToken()
            },
            body: JSON.stringify({
                "elementCode": elementId
            }),
            credentials: "include"
        });
        const data = await res.json();
        console.log("removeLearnedElement: ", data);
        return data;
    } catch (error) {
        console.error("Failed to remove learned Element: ", error);
        return { message: "Element konnte nicht aus den 'gelernten' entfernt werden", ok: false };
    }
}