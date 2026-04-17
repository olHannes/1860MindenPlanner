
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

    elementFilter: {
        difficulty: null,
        group: null,
        learned: false,
        search: ''
    }
};

function getApparatusById(id) {
  return config.APPARATUS.find(a => a.id === id) ?? null;
}
function getRoutineType() {
    return state.mode === "wish" ? 1 : 0;
}

export function showView(root, next) {
    state.view = next;
    
    const viewApparatusList = root.querySelector("#view-apparatus-list");
    const viewApparatusDesc = root.querySelector("#view-apparatus-detail");
    const viewEditor        = root.querySelector("#view-apparatus-editor");
    const viewElementList   = root.querySelector("#view-element-list");
    const viewElementDetail = root.querySelector("#view-element");

    if(viewApparatusList) viewApparatusList.hidden  = next !== "apparatus-list";
    if(viewApparatusDesc) viewApparatusDesc.hidden  = next !== "apparatus-desc";
    if(viewEditor) viewEditor.hidden                = next !== "routine-editor";
    if(viewElementList) viewElementList.hidden      = next !== "element-list"
    if(viewElementDetail) viewElementDetail.hidden  = next !== "element-details";
}

export function initElementFilters(root) {
    const difficultyContainer   = root.querySelector('#filterDifficulty');
    const groupContainer        = root.querySelector('#filterGroup');
    const learnedCheckbox       = root.querySelector('#filterLearnedElements');
    const searchInput           = root.querySelector('#searchInput');

    difficultyContainer?.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if(!button) return;
        state.elementFilter.dataset = button.dataset.value
            ? Number(button.dataset.value)
            : null;
        setActiveButton(difficultyContainer, button);
        renderElementList(root);
    });
    groupContainer?.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if(!button) return;
        state.elementFilter.group = button.dataset.value
            ? Number(button.dataset.value)
            : null;
        setActiveButton(groupContainer, button);
        renderElementList(root); 
    });
    learnedCheckbox?.addEventListener('change', async (event) => {
        state.elementFilter.learned = event.target.checked;
        renderElementList(root);
    });
    searchInput?.addEventListener('input', debounce(async (event) => {
        state.elementFilter.search = event.target.value;
        renderElementList(root);
    }, 300));
}

function setActiveButton(container, activeButton) {
    container.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('active-filter');
    });
    activeButton.classList.add('active-filter');
}
function debounce(fn, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}



async function fetchFilteredElementList(root) {
    let apparatus = state.selectedApparatusId;
    if(!root || !apparatus) return;

    let url = `${config.serverURL}/exercise/elements?device=${apparatus}`;
    let filter = state.elementFilter;
    const userId = localStorage.getItem("userId");
    if(filter.difficulty)       url+=`&difficulty=${filter.difficulty}`;
    if(filter.group)            url+=`&group=${filter.group}`;
    if(filter.learned != null)  url+=`&learned=${filter.learned}`;
    if(userId)                  url+=`&userId=${userId}`;
    if(filter.search)           url+=`&search=${filter.search}`;
    
    try {
        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json"}
        });
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch filtered element-list");
        return { message: "Fehler beim laden", ok: false};
    }
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
    const userId = localStorage.getItem("userId");
    const routineType = getRoutineType();
    const response = await fetchExercise(
        userId, 
        state.selectedApparatusId, 
        routineType, 
        null);
        const exercise = response?.exercise ?? null;
        state.elements = exercise?.elemente ?? [];
        state.community.avg = exercise?.communityAvg ?? 0;
        state.community.count = exercise?.communityCount ?? 0;

        if(response?.autoRating){
            state.autoRating = response?.autoRating;
        }
        root.querySelector("#comp-routine-btn")?.classList.toggle("is-active", routineType == 0);
        root.querySelector("#wish-routine-btn")?.classList.toggle("is-active", routineType == 1);
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

    state.selectedApparatusId = a.id;

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

function buildElementPickerElement(root, e) {
    if(!root || !e) return;

    let div = root.createElement("div");
    div.classList.add("element");

    let header = root.createElement("header");
    header.classList.add("element-header");
    
    let img = root.createElement("img");
    img.classList.add("element-preview");
    img.alt = "Preview Image";
    img.src = e.image_path;

    let groupSpan = root.createElement("span");
    groupSpan.classList.add("element-info-span");
    groupSpan.innerText = (e.elementegruppe ?? "-") + " G.";

    let valueSpan = root.createElement("span");
    valueSpan.classList.add("element-info-span");
    valueSpan.innerText = (e.wertigkeit ?? "-") + " P.";

    let dismountSpan = root.createElement("span");
    dismountSpan.classList.add("element-info-span");
    dismountSpan.innerText = "Abg.";

    let titleSpan = root.createElement("span");
    titleSpan.classList.add("element-title");
    titleSpan.innerText = e.bezeichnung ?? "<not found>";

    let nameSpan = root.createElement("span");
    nameSpan.classList.add("element-name");
    nameSpan.innerText = e.name ?? "";

    header.appendChild(groupSpan);
    header.appendChild(valueSpan);
    if(e.dismount) {
        header.appendChild(dismountSpan);
    }
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(titleSpan);
    if(e.name) {
        div.appendChild(nameSpan);
    }

    return div;
}

async function renderElementList(root) {
    const container = root.querySelector(".element-list-container");
    if(!container) return;
    container.innerHTML = "";

    const data = await fetchFilteredElementList(root);
    if(!data.elements || !Array.isArray(data.elements) || data.elements.length <= 0) {
        let p = root.createElement("p");
        p.classList.add("routine-empty-msg");
        container.appendChild(p);
        return;    
    }
    data.elements.forEach(element => {
        //console.log(element);

        let elem = buildElementPickerElement(root, element);
        container.appendChild(elem);
    });
}





export function addExerciseEventListener(root) {
    const container = root.querySelector("#panel1");
    container?.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if(!actionEl) return;

        const action = actionEl.dataset.action;

        console.log("action: ", action);


        //Navigate to next page
        if (action === "open-detail") {
            const id = actionEl.dataset.apparatusId;
            if(!id) return;
            renderApparatusDetail(root, id);
            showView(root, "apparatus-desc");

        } else if (action === "to-exercise-editor") {
            const id = actionEl.dataset.apparatusId;
            if(!id) return;
            renderApparatusEditor(root, id);

            panel.clearHTML(root.querySelector(".element-list-container"));
            renderElementList(root);

            showView(root, "routine-editor");
        
        } else if (action === "open-element-picker") {
            showView(root, "element-list");
        }

        //Navigate to previous page
        else if (action === "back-to-list") {
            showView(root, "apparatus-list");
        
        } else if (action === "back-to-details") {
            showView(root, "apparatus-desc");

        } else if (action === "back-to-exercise-editor") {
            showView(root, "routine-editor");

        }

        //Editor functionality
        else if (action === "add-to-exercise") {

        }
        else if (action === "changed-learned-element") {

        }
        else if (action === "save-exercise") {

        }
        else if (action === "set-mode") {
            const mode = actionEl.dataset.mode;
            if(!mode) return;
            changeRoutineType(root, mode);
        }

    });
}