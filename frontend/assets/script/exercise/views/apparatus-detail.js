
import { APPARATUS } from "../../config.js";
import { clearHTML } from "../../panel-handling.js";
import { setupCurrentExercise } from "../actions.js";
import { VIEWS } from "../constants.js";
import { state } from "../state.js";
import { renderElementList } from "./element-list.js";
import { showView } from "./navigation.js";
import { renderApparatusEditor } from "./routine-editor.js";


export function setupApparatusDetailsEvents(root) {
    const apparatusDetailsContainer = root.querySelector("#view-apparatus-detail");
    apparatusDetailsContainer?.addEventListener("click", (event) => {
        const target = event.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;

        switch (action) {
            case 'prev-apparatus':
                showPrevApparatus(root);
                scheduleExercisePrefetch(root);
                break;

            case 'next-apparatus':
                showNextApparatus(root);
                scheduleExercisePrefetch(root);
                break;

            case 'to-exercise-editor':
                const id = target.dataset.apparatusId;
                if(!id) return;

                if(apparatusPrefetchTimer) {
                    clearTimeout(apparatusPrefetchTimer);
                    apparatusPrefetchTimer = null;
                }
                
                renderApparatusEditor(root, id);

                clearHTML(root.querySelector(".element-list-container"));
                renderElementList(root);

                showView(root, VIEWS.ROUTINE_EDITOR);
                break;
            
            case 'back-to-list':
                showView(root, VIEWS.APPARATUS_LIST);
                break;

            default:
                break;
        }
    });
}


export function renderApparatusDetailByIndex(root, index) {
    if(!root || index < 0 || index >= APPARATUS.length) return;

    const a = APPARATUS[index];
    if(!a) return;
    
    state.navigation.selectedApparatusIndex = index;
    state.navigation.selectedApparatusId = a.id;

    const nameDe    = root.querySelector('#detailNameDe');
    const nameEn    = root.querySelector('#detailNameEn');
    const img       = root.querySelector('#detailImg');
    const facts     = root.querySelector('#detailFacts');
    const groups    = root.querySelector('#detailGroups');
    const btn       = root.querySelector('#startEditor');

    if(img) {
        img.src = a.icon;
        img.alt = a.nameEn;
    }
    if(facts) {
        facts.innerHTML = a.facts
            .map(f => `<div class="fact">${f}</div>`)
            .join("");
    }
    if(groups) {
        groups.innerHTML = a.groups
            .map(g => `<li>${g}</li>`)
            .join("");
    }
    if(nameDe) nameDe.innerText = a.nameDe;
    if(nameEn) nameEn.innerText = a.nameEn;

    if(btn) btn.dataset.apparatusId = a.id;
    setupCurrentExercise(root);
}


export function renderApparatusDetail(root, apparatusId) {
    if(!root || !apparatusId) return;

    const index = APPARATUS.findIndex(a => a.id === apparatusId);
    if(index === -1) return;

    renderApparatusDetailByIndex(root, index);
}


export function showNextApparatus(root) {
    const current = state.navigation.selectedApparatusIndex;
    const next = (current + 1) % APPARATUS.length;
    if (next < APPARATUS.length) {
        renderApparatusDetailByIndex(root, next);
    }
}
export function showPrevApparatus(root) {
    const current = state.navigation.selectedApparatusIndex;
    const prev = (current - 1 + APPARATUS.length) % APPARATUS.length;
    if (prev >= 0) {
        renderApparatusDetailByIndex(root, prev);
    }
}


let apparatusPrefetchTimer = null;
function scheduleExercisePrefetch(root, delay = 2000) {
    if (apparatusPrefetchTimer) {
        clearTimeout(apparatusPrefetchTimer);
    }

    apparatusPrefetchTimer = setTimeout(() => {
        clearHTML(root.querySelector(".element-list-container"));
        renderElementList(root);
        apparatusPrefetchTimer = null;
    }, delay);
}