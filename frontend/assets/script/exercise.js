
import * as config from "./config.js";
import * as panel from "./panel-handling.js";

const state = {
    view: "list", //list | detail | editor
    selectedApparatusId: null,
    mode: "wish",
    elements: [
        //{id, name, img}
    ],
    autoRating: { },
    community: { avg: 0.0, count: 0}, //only for competition
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
    if (!userId || !dev || (type != 0 && type != 1)) {
        return { ok: false, message: "Fehlende Parameter", exercise: { elements: [] } };
    }
    const fetchUrl = `${config.serverURL}/routine`
        + `?userId=${userId}`
        + `&apparatus=${dev}`
        + `&type=${type}`
        + `&expand=elements`
        + `&include=autoRating`;
    try {
        panel.showLoader(loader);
        const res = await fetch(fetchUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch exercise:", error);
        return {ok: false, elements: []};
    } finally {
        panel.hideLoader(loader);
    }
}
async function setupCurrentExercise(root) {
    const response = await fetchExercise(localStorage.getItem("userId"), 
        state.selectedApparatusId, 
        getRoutineType(), 
        null);
        const exercise = response?.exercise ?? null;
        state.elements = exercise?.elemente ?? [];
        state.community.avg = exercise?.communityAvg ?? 0;
        state.community.count = exercise?.communityCount ?? 0;

        if(response?.autoRating){
            state.autoRating = response?.autoRating;
        }
}

async function changeRoutineType(root, type) {
    if(!root || !["wish", "competition"].includes(type)) return;
    state.mode = type;
    await setupCurrentExercise(root);
    renderApparatusEditor(root, state.selectedApparatusId);
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
    if(Array.isArray(state.elements) && state.elements.length > 0) {
        tbody.innerHTML = state.elements.map((el, i) => `
        <tr class="row" draggable="true"
            data-row-index="${i}"
            data-element-id="${el.id}"
        >
            <td>${i+1}</td>
            <td>
                <div class="row-title">${el.bezeichnung}</div>
            </td>
            <td>
            <img class="row-img" src="${el.image_path}" alt="">
            </td>
            <td class="row-actions">
                <button type="button" class="icon-btn" data-action="move-up" data-index="${i}" aria-label="Nach oben">↑</button>
                <button type="button" class="icon-btn" data-action="move-down" data-index="${i}" aria-label="Nach unten">↓</button>
                <button type="button" class="icon-btn danger" data-action="remove-element" data-index="${i}" aria-label="Löschen">🗑</button>
            </td>
        </tr>
        `).join("");
        root.querySelector(".table-wrap .routine-empty-msg")?.remove();
        
    } else {
        tbody.innerHTML = "";
        const twrapper = root.querySelector(".table-wrap");
        twrapper?.querySelector(".routine-empty-msg")?.remove();

        const p = document.createElement("p");
        p.classList.add("routine-empty-msg");
        p.innerText = "Bisher wurde keine Übung erstellt";
        if(twrapper) twrapper.appendChild(p);

        state.autoRating = {};
        state.community = { avg: 0.0, count: 0};
    }
}
function renderAutoEval(root) {
    const totDiffi = root.querySelector("#totalDifficulty");
    const basDiffi = root.querySelector("#baseDifficulty");
    const groBonus = root.querySelector("#groupBonus");
    const disBonus = root.querySelector("#dismountBonus");
    const warnCont = root.querySelector("#warning-container");
    const errConta = root.querySelector("#error-container");
    if(state.autoRating) {
        if(totDiffi) totDiffi.innerText = state.autoRating.totalDifficulty ?? "-";
        if(basDiffi) basDiffi.innerText = state.autoRating.baseDifficulty ?? "-";
        if(groBonus) groBonus.innerText = state.autoRating.groupBonus ?? "-";
        if(disBonus) disBonus.innerText = state.autoRating.dismountBonus ?? "-";

        if(warnCont) {
            warnCont.innerHTML = "";
            state.autoRating?.warnings?.forEach(element => {
                const p = root.createElement("p");
                p.classList.add("warning");
                p.innerText = element;
                warnCont.appendChild(p);
            });
        }
        if(errConta) {
            errConta.innerHTML = "";
            state.autoRating?.errors?.forEach(element => {
                const p = root.createElement("p");
                p.classList.add("error");
                p.innerText = element;
                errConta.appendChild(p);
            });
        }
    }
}
function renderCommunity(root) {
    const container = root.querySelector("#communitySection");
    const stars = container.querySelector("#avgStars");
    const avg = container.querySelector("#avgRatingText");
    const num = container.querySelector("#ratingCountText");

    container?.querySelector(".routine-empty-msg")?.remove();

    const avgNum = state.community.avg ?? 0.0;
    const count = state.community.count;
    const avgFull = Math.floor(avgNum);
    const avgHalf = avgNum % 1 >= 0.5 ? 1 : 0;
    const avgEmpty = 5 - avgFull - avgHalf;

    const starFull = "★";
    const starEmpty = "☆";

    if(count) {
        num.innerText = `${count} Bewertungen`;
        avg.innerText = `${avgNum}`;
        stars.innerText = 
            starFull.repeat(avgFull) + 
            (avgHalf ? starFull : "") + 
            starEmpty.repeat(avgEmpty);
        panel.show(num);
        panel.show(avg);
        panel.show(stars);
    }else {
        num.innerText = `0 Bewertungen`;
        avg.innerText = ` - `;
        stars.innerText = "☆☆☆☆☆";
        panel.hide(num);
        panel.hide(avg);
        panel.hide(stars);

        const p = document.createElement("p");
        p.classList.add("routine-empty-msg");
        p.innerText = "Bisher gibt es keine Bewertungen von anderen Nutzern";
        if(container) container.appendChild(p);
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
        } else if (action === "save-exercise") {
        } else if (action === "set-mode") {
            const type = actionEl.dataset.mode;
            if(!type) return;
            changeRoutineType(root, type);
        }
    });
}