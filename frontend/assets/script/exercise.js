
import * as config from "./config.js";
import { hideLoader, showLoader } from "./panel-handling.js";

const state = {
    view: "list", //list | detail | editor
    selectedApparatusId: null,
    mode: "wish",
    elements: [
        //{id, name, img}
    ],
    community: { avg: null, count: 0}, //only for competition
};

function getApparatusById(id) {
  return config.APPARATUS.find(a => a.id === id) ?? null;
}
function getRoutineType() {
    return state.mode === "wish" ? 1 : 0;
}

export function showView(root, next) {
    state.view = next;
    
    const viewList = root.querySelector("#view-apparatus-list");
    const viewDetail = root.querySelector("#view-apparatus-detail");
    const viewEditor = root.querySelector("#view-apparatus-editor");

    if(viewList) viewList.hidden = next !== "list";
    if(viewDetail) viewDetail.hidden = next !== "detail";
    if(viewEditor) viewEditor.hidden = next !== "editor";
}



async function fetchExercise(userId, dev, type, loader) {
    if(!userId || !dev ||!type) return;
    const fetchUrl = `${config.serverURL}/exercise`
        + `?userId=${userId}`
        + `&apparatus=${dev}`
        + `&type=${type}`;
    try {
        showLoader(loader);
        const res = await fetch(fetchUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if(data.ok) return data.exercise;
        return [];
    } catch (error) {
        console.error("Failed to fetch exercise:", error);
        return []
    } finally {
        hideLoader(loader);
    }
}
async function setupCurrentExercise(root) {
    const exercise = await fetchExercise(localStorage.getItem("userId"), 
        state.selectedApparatusId, 
        getRoutineType(), 
        null);
    state.elements = exercise.elements;
    state.community.avg = exercise.communityAvg;
    state.community.count = exercise.communityCount;
}



export function renderApparatusCards(root) {
    const container = root.querySelector("#apparatus-container");
    if(!container) return;

    const html = config.APPARATUS.map(a => `
        <button
            class="apparatus-card"
            type="button"
            data-action="open-detail"
            data-apparatus-id="${a.id}"
            aria-label="Öffne Details: ${a.nameDe}"
        >
            <div class="name-container">
                <h2 class="name-de">${a.nameDe}</h2>
                <h3 class="name-en">${a.nameEn}</h3>
            </div>
            <img src="${a.icon}" alt="${a.nameEn}" class="apparatus-image">
        </button>
    `).join("");
    
    container.innerHTML = html;
}

function renderApparatusDetail(root, apparatusId) {
    if(!root || !apparatusId) return;

    const a = getApparatusById(apparatusId);
    if(!a) return;

    const detailNameDe  = root.querySelector("#detailNameDe");
    const detailNameEn  = root.querySelector("#detailNameEn");
    const detailImg     = root.querySelector("#detailImg");
    const detailFacts   = root.querySelector("#detailFacts");
    const detailGroups  = root.querySelector("#detailGroups");
    const editorBtn     = root.querySelector("#startEditor");

    if(detailImg) {
        detailImg.src = a.icon;
        detailImg.alt = a.nameEn;
    }
    if(detailFacts) {
        detailFacts.innerHTML = a.facts
            .map(f => `<div class="fact">${f}</div>`)
            .join("");
    }
    if(detailGroups) {
        detailGroups.innerHTML = a.groups
            .map(g => `<li>${g}</li>`)
            .join("");
    }
    if(detailNameDe) detailNameDe.innerText = a.nameDe;
    if(detailNameEn) detailNameEn.innerText = a.nameEn;
    if(editorBtn) editorBtn.dataset.apparatusId = a.id;

    setupCurrentExercise(root);
}

function renderApparatusEditor(root, apparatusId) {
    if(!root || !apparatusId) return;

    const a = getApparatusById(apparatusId);
    if(!a) return;
    
    const title = root.querySelector("#editorName");
    if(title) title.innerText = a.nameDe;

    renderEditorRows(root);
    renderAutoEval(root);
    renderCommunity(root);
}
function renderEditorRows(root) {
    const tbody = root.querySelector("#editorRows");
    if(!tbody) return;
    console.log(state);
    tbody.innerHTML = state.elements.map((el, i) => `
        <tr class="row" draggable="true"
            data-row-index="${i}"
            data-element-id="${el.id}"
        >
            <td>${i+1}</td>
            <td>
                <div class="row-title">${el.name}</div>
            </td>
            <td>
                <img class="row-img" src="${el.img}" alt="">
            </td>
            <td class="row-actions">
                <button type="button" class="icon-btn" data-action="move-up" data-index="${i}" aria-label="Nach oben">↑</button>
                <button type="button" class="icon-btn" data-action="move-down" data-index="${i}" aria-label="Nach unten">↓</button>
                <button type="button" class="icon-btn danger" data-action="remove-element" data-index="${i}" aria-label="Löschen">🗑</button>
            </td>
        </tr>
    `).join("");
}
function renderAutoEval(root) {

}
function renderCommunity(root) {

}

export function addExerciseEventListener(root) {
    const container = root.querySelector("#panel1");
    container?.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if(!actionEl) return;

        const action = actionEl.dataset.action;
        if(action === "open-detail") {
            const id = actionEl.dataset.apparatusId;
            if(!id) return;
            state.selectedApparatusId = id;
            renderApparatusDetail(root, id);
            showView(root, "detail");
        } else if (action === "back-to-list") {
            showView(root, "list");
        } else if (action === "back-to-details") {
            showView(root, "detail");
        } else if (action === "to-exercise-editor") {
            const id = state.selectedApparatusId;
            if(!id) return;
            renderApparatusEditor(root, id);
            showView(root, "editor");
        }
    });
}