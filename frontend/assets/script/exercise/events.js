
import { saveExercise } from "./api.js";
import { VIEWS } from "./constants.js";
import { state } from "./state.js";
import { showView } from "./views/navigation.js";

import { renderApparatusDetail, setupApparatusDetailsEvents } from "./views/apparatus-detail.js";
import { renderApparatusEditor, setupRoutineEditorEvents } from "./views/routine-editor.js"
import { clearHTML } from "../panel-handling.js";
import { renderElementList, setupElementListEvents } from "./views/element-list.js";
import { setupUIEvents } from "./views/apparatus-list.js";
import { setupElementDetailEvents } from "./views/element-details-overlay.js";


export function bindExerciseEvents(root) {
    setupUIEvents(root);
    
    setupApparatusDetailsEvents(root);
    
    setupRoutineEditorEvents(root);
    
    setupElementListEvents(root);
    
    setupElementDetailEvents(root);

    const container = root.querySelector("#panel1");
    container?.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if(!actionEl) return;
        const action = actionEl.dataset.action;
        console.log("action: ", action);
    });
}