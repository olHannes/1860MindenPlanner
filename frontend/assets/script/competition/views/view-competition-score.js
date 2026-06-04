import { hide, hideLoader, show, showLoader, showMessage } from "../../panel-handling.js";
import { fetchCompetitionScores, fetchUpdateCompetitionScore } from "../api.js";
import { renderCompetitionList } from "./view-competition-list.js";



export function bindCompetitionScoreEvents(root) {
    const elementListContainer = root.querySelector("#score-panel");
    elementListContainer?.addEventListener("click", async (event) => {
        const target = event.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;
        console.log(action);

        const compId = target.dataset._id;

        switch (action) {
            case 'cancelScore':
                showCompetitionList(root);
                break;
            
            case 'submitScore':
                //showScoreForm(root, compId, userId);
                updateCompetitionScore(root, compId);
                break;

            default:
                break;
        }
    });
}


export function showScoreForm(root, compId) {
    if(!root || !compId) return;
    const score_container = root.querySelector("#score-panel");
    const comp_container = root.querySelector("#competition-panel");

    hide(comp_container);
    show(score_container, "block");

    const submitBtn = score_container.querySelector('[data-action="submitScore"]');
    if(submitBtn) {
        submitBtn.dataset._id = compId;
    }
    loadCompetitionScores(root, compId);
}


function showCompetitionList(root) {
    const score_container = root.querySelector("#score-panel");
    const comp_container = root.querySelector("#competition-panel");
    hide(score_container);
    show(comp_container, "block");
    renderCompetitionList(root);
}


function showScoreLoader(root, msg = "Daten werden geladen") {
    if(!root) return;
    const loader = root.querySelector("#scorePanelLoading .spinner");
    const loaderBackground = root.querySelector("#scorePanelLoading");
    const loaderMsg = loaderBackground?.querySelector("p");

    if(loaderMsg) loaderMsg.innerText = msg;
    show(loaderBackground, "flex");
    showLoader(loader);
}


function hideScoreLoader(root) {
    const loader = root.querySelector("#scorePanelLoading .spinner");
    const loaderBackground = root.querySelector("#scorePanelLoading");
    hideLoader(loader);
    hide(loaderBackground);
}




async function loadCompetitionScores(root, compId) {
    if(!root || !compId) {
        console.error("loadCompetitionScores failed: missing fields");
        return;
    }
    showScoreLoader(root, "Gespeicherte Wertungen werden geladen");

    const result = await fetchCompetitionScores({ compId: compId });
    fillScorePlaceholder(root, result.scores, "keine Punkte");
    hideScoreLoader(root);
}

function fillScorePlaceholder(root, scores = {}, emptyPlaceholder = "keine Punkte") {
    if(!root) {
        console.error("fillSCorePlaceholder failed: missing fields");
        return;
    }
    const inputs = getScoreInputs(root);
    Object.entries(inputs).forEach(([device, input]) => {
        if(!input) return;
        const value = scores[device];
        input.value = "";

        if(value === undefined || value === null) {
            input.placeholder = emptyPlaceholder;
        } else {
            input.value = String(value);
        }
    });
}

function getScoreInputs(root) {
    return {
        Boden: root.querySelector("#FlScore"),
        Pauschenpferd: root.querySelector("#PoScore"),
        Ringe: root.querySelector("#RiScore"),
        Sprung: root.querySelector("#VaScore"),
        Barren: root.querySelector("#PaScore"),
        Reck: root.querySelector("#HiScore")
    };
}
function getNumberValue(root, selector) {
    const val = root.querySelector(selector)?.value || "";
    return Number(val.replace(",", ".")) || 0;
}


async function updateCompetitionScore(root, compId) {
    if(!root || !compId) return;

    showScoreLoader(root, "Wertungen werden gespeichert");

    const score = {
        "scores": {
            "Boden":            getNumberValue(root, "#FlScore"),
            "Barren":           getNumberValue(root, "#PaScore"),
            "Reck":             getNumberValue(root, "#HiScore"),
            "Ringe":            getNumberValue(root, "#RiScore"),
            "Pauschenpferd":    getNumberValue(root, "#PoScore"),
            "Sprung":           getNumberValue(root, "#VaScore")
        }
    };
    const result = await fetchUpdateCompetitionScore({ compId: compId, scores: score });
    const title = result.ok
        ? "Punkte gespeichert"
        : "Punkte nicht gespeichert";
    const msg = result.message;

    showMessage(root, title, msg);
    showCompetitionList(root);

    hideScoreLoader(root);
}