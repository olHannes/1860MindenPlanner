
import * as config from "./config.js";

const state = {
    view: "list", //list | detail | editor
    selectedApparatusId: null,
};

function getApparatusById(id) {
  return config.APPARATUS.find(a => a.id === id) ?? null;
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

export function renderApparatusDetail(apparatusId) {
    const a = getApparatusById(apparatusId);
    if(!a) return;

    const detailNameDe  = document.querySelector("#detailNameDe");
    const detailNameEn  = document.querySelector("#detailNameEn");
    const detailImg     = document.querySelector("#detailImg");
    const detailFacts   = document.querySelector("#detailFacts");
    const detailGroups  = document.querySelector("#detailGroups");
    
    if(detailNameDe) detailNameDe.innerText = a.nameDe;
    if(detailNameEn) detailNameEn.innerText = a.nameEn;
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
            renderApparatusDetail(id);
            showView(root, "detail");

        } else if (action === "back-to-list") {
            showView(root, "list");

        } else if (action === "to-exercise-editor") {
            showView("editor");
            
        }
    });
}