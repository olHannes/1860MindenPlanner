
import { APPARATUS } from "../../config.js";
import { clearHTML, resetPanel, show, hide, showMessage } from "../../panel-handling.js";
import { saveExercise } from "../api.js";
import { setupCurrentExercise } from "../actions.js";
import { VIEWS } from "../constants.js";
import { state } from "../state.js";
import { showView } from "./navigation.js";


export function setupRoutineEditorEvents(root) {
    const routineEditorContainer = root.querySelector("#view-apparatus-editor");
    routineEditorContainer?.addEventListener("click", async (event) => {
        const target = event.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;

        switch (action) {
            case 'back-to-details':
                if(!state.routine.saved) {
                    //showMessage(root, "Übung ist noch nicht gespeichert", "Beim verlassen des Editors gehen Änderungen verloren.");
                    const shouldLeave = confirm("Ungespeicherte Änderungen verwerfen?");
                    if(!shouldLeave) return;
                 
                    state.routine.elements = structuredClone(state.routine.originalElements);
                    state.routine.saved = true;
                    renderEditorRows(root);
                }
                showView(root, VIEWS.APPARATUS_DESC);
                break;
            
            case 'toggle-routine-type':
                const currentMode = target.dataset.mode;
                const routineMode = (currentMode === "competition") ? "wish" : "competition";
                
                target.dataset.mode = routineMode;
                const label = root.querySelector("#competition-type-label");
                if(label) label.innerText = routineMode === "competition" ? "Wettkampf-Übung" : "Wunsch-Übung";

                changeRoutineType(root, routineMode);
                break;

            case 'set-mode':
                const mode_ = target.dataset.mode;
                if(!mode_) return;
                changeRoutineType(root, mode_);
                break;

            case 'save-exercise':
                const result = await saveExercise({
                    elements: state.routine.elements,
                    apparatusId: state.navigation.selectedApparatusId,
                    routineType: state.routine.mode == "wish" ? "1" : "0"
                });
                if(result.ok) state.routine.originalElements = structuredClone(state.routine.elements);
                await setupCurrentExercise(root);
                renderApparatusEditor(root, state.navigation.selectedApparatusId);
                break;

            case 'restore-exercise':
                showMessage(root, "Übung zurückgesetzt", "Die Übung wurde erfolgreich zurückgesetzt.");
                state.routine.saved = true;
                if(state.routine.elements == state.routine.originalElements) return;
                state.routine.elements = structuredClone(state.routine.originalElements);
                renderEditorRows(root);
                break;

            case 'open-element-picker':
                showView(root, VIEWS.ELEMENT_LIST);
                break;
                
            case 'remove-element':
                const index = target.dataset.index;
                state.routine.elements.splice(index, 1);
                state.routine.saved = false;
                renderEditorRows(root);
                break;

            default:
                break;
        }
    });
    setupRoutineDragAndDrop(root);
}


function setupRoutineDragAndDrop(root) {
    const tbody = root.querySelector("#editorRows");
    if(!tbody) return;

    let draggedIndex = null;
    tbody.addEventListener("dragstart", (event) => {
        const row = event.target.closest("[data-row-index]");
        if(!row) return;

        draggedIndex = Number(row.dataset.rowIndex);
        row.classList.add("is-dragging");
        
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(draggedIndex));
    });
    tbody.addEventListener("dragover", (event) => {
        event.preventDefault();

        const draggingRow = tbody.querySelector(".is-dragging");
        const targetRow = event.target.closest("[data-row-index]");

        if (!draggingRow || !targetRow || draggingRow === targetRow) return;

        const targetRect = targetRow.getBoundingClientRect();
        const shouldInsertAfter = event.clientY > targetRect.top + targetRect.height / 2;

        if (shouldInsertAfter) {
            targetRow.after(draggingRow);
        } else {
            targetRow.before(draggingRow);
        }
    });
    tbody.addEventListener("drop", (event) => {
        event.preventDefault();

        const newIndexes = [...tbody.querySelectorAll("[data-row-index]")]
            .map(row => Number(row.dataset.rowIndex));

        state.routine.elements = newIndexes.map(index => state.routine.elements[index]);

        state.routine.saved = false;
        draggedIndex = null;

        renderEditorRows(root);
    });
    tbody.addEventListener("dragend", () => {
        tbody.querySelector(".is-dragging")?.classList.remove("is-dragging");
        draggedIndex = null;
    });
}


async function changeRoutineType(root, type) {
    if(!root || !["wish", "competition"].includes(type)) return;
    if(!state.routine.saved) {
        showMessage(root, "Übung ist noch nicht gespeichert", "Beim verlassen des Editors gehen Änderungen verloren.");
        return;
    }
    state.routine.mode = type;
    await setupCurrentExercise(root);
    renderApparatusEditor(root, state.navigation.selectedApparatusId);
}


export function addElementToRoutine(root, element) {
    if(!root || !element) return;

    state.routine.elements.push(element);
    state.routine.saved = false;
    renderEditorRows(root);
}


export function renderApparatusEditor(root, apparatusId) {
    if(!root || !apparatusId) return;

    const a = APPARATUS.find(a => a.id === apparatusId) ?? null;
    if(!a) return;

    const title = root.querySelector('#editorName');
    if(title) title.innerText = a.nameDe;

    renderEditorRows(root);
    renderAutoEval(root);
    renderCommunity(root);
}


function renderEditorRows(root) {
    const container = root.querySelector("#editorRows");
    if(!container) return;

    const wrapper = root.querySelector(".table-wrap");
    root.querySelectorAll(".routine-empty-msg").forEach(el => el.remove());


    if(!Array.isArray(state.routine.elements) || state.routine.elements.length === 0) {
        clearHTML(container);

        const p = document.createElement("p");
        p.classList.add("routine-empty-msg");
        p.innerText = "Bisher wurde keine Übung erstellt";
        wrapper?.appendChild(p);

        state.routine.autoRating = {};
        state.routine.community = { avg: 0.0, count: 0 };
        return;
    }

    container.innerHTML = state.routine.elements.map((el, i) => `
        <li class="routine-dnd-item" draggable="true" data-row-index="${i}">
            <span class="routine-dnd-handle">☰</span>

            <span class="routine-dnd-number">${i + 1}</span>

            <img class="row-img" src="${el.image_path}" alt="">

            <div class="routine-dnd-content">
                <div class="row-title">${el.bezeichnung}</div>
                <small>${el.name ?? ""}</small>
            </div>

            <button 
                type="button" 
                class="delete-btn" 
                data-action="remove-element" 
                data-index="${i}" 
                aria-label="Löschen">
                🗑
            </button>
        </li>
    `).join("");
}


function renderAutoEval(root) {
    if(!state.routine.autoRating) return;
    
    const difficultyEl  = root.querySelector('#totalDifficulty');
    const baseDiffEl    = root.querySelector('#baseDifficulty');
    const groupBonEl    = root.querySelector('#groupBonus');
    const dismBonEl     = root.querySelector('#dismountBonus');
    const warnContEl    = root.querySelector('#warning-container');
    const errContaEl    = root.querySelector('#error-container');

    const autoRating    = state.routine.autoRating;

    if(difficultyEl) difficultyEl.innerText = autoRating.totalDifficulty ?? "-";
    if(baseDiffEl) baseDiffEl.innerText     = autoRating.baseDifficulty ?? "-";
    if(groupBonEl) groupBonEl.innerText     = autoRating.groupBonus ?? "-";
    if(dismBonEl) dismBonEl.innerText       = autoRating.dismountBonus ?? "-";

    if(warnContEl) {
        clearHTML(warnContEl);
        state.routine.autoRating?.warnings?.forEach(warning => {
            const p = root.createElement('p');
            p.className = "warning";
            p.innerText = warning;
            warnContEl.appendChild(p);
        });
    }
    if(errContaEl) {
        clearHTML(errContaEl);
        state.routine.autoRating?.errors?.forEach(error => {
            const p = root.createElement('p');
            p.className = "error";
            p.innerText = error;
            errContaEl.appendChild(p);
        });
    }
}


function renderCommunity(root) {
    const container = root.querySelector('#communitySection');
    const stars     = container?.querySelector('#avgStars');
    const avg       = container?.querySelector('#avgRatingText');
    const num       = container?.querySelector('#ratingCountText');

    container?.querySelector('.routine-empty-msg')?.remove();

    const communityRating   = state.routine.community;
    const avgNum            = communityRating.avg;
    const count             = communityRating.count;
    const avgFull           = Math.floor(avgNum);
    const avgHalf           = avgNum % 1 >= 0.5 ? 1 : 0;
    const avgEmpty          = 5 - avgFull - avgHalf;

    const starFull  = "★";
    const starEmpty = "☆";

    if(count > 0) {
        num.innerText   = `${count} Bewertungen`;
        avg.innerText   = `${avgNum}`;
        stars.innerText =
            starFull.repeat(avgFull) +
            (avgHalf ? starFull : "") +
            starEmpty.repeat(avgEmpty);
        panel.show(num);
        panel.show(avg);
        panel.show(stars);
    } else {
        num.innerText   = `0 Bewertungen`;
        avg.innerText   = ` - `;
        stars.innerText = `☆☆☆☆☆`;
        hide(num); 
        hide(avg); 
        hide(stars);
        
        const p = root.createElement('p');
        p.className = 'routine-empty-msg';
        p.innerText = "Bisher gibt es keine Bewertungen von anderen Nutzern";
        if(container) container.appendChild(p);
    }
}
