
import { APPARATUS } from "../../config.js";
import { clearHTML, showLoader } from "../../panel-handling.js";
import { fetchFilteredElementList } from "../api.js";
import { VIEWS } from "../constants.js";
import { state } from "../state.js";
import { openElementDetailsOverlay } from "./element-details-overlay.js";
import { showView } from "./navigation.js";


export function setupElementListEvents(root) {
    const elementListContainer = root.querySelector("#view-element-list");
    elementListContainer?.addEventListener("click", (event) => {
        const target = event.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;

        switch (action) {
            case 'back-to-exercise-editor':
                showView(root, VIEWS.ROUTINE_EDITOR);
                break;
            
            case 'open-element-details':
                const id = target.dataset.elementId;
                if(!id) return;

                const items = state.elementList.items;
                const index = items.findIndex(item => String(item.id) === String(id));
                if(index === -1) return;

                openElementDetailsOverlay(root, items, index);
                break;

            default:
                break;
        }
    });
}

export function renderFilterElements(root, FilterElements) {
    if(!root || !FilterElements) return;
    renderFilterGroup(
        root.querySelector("#filterDifficulty"),
        FilterElements.difficulty
    );

    renderFilterGroup(
        root.querySelector("#filterGroup"),
        FilterElements.groups
    );
}
function renderFilterGroup(container, filters) {
    if (!container) return;
    clearHTML(container);
    filters.forEach((filter, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = filter.label;
        button.dataset.value = filter.value;

        if (index === 0) button.classList.add("active-filter");

        container.appendChild(button);
    });
}


export async function renderElementList(root) {
    const container = root.querySelector('.element-list-container');
    if(!container) return;
    clearHTML(container);
    renderElementListLoader(root, container);

    const data = await fetchFilteredElementList({ 
        apparatusId: state.navigation.selectedApparatusId,
        filter: state.elementList.filter,
        userId: localStorage.getItem("userId")
     });

    if(!data.elements || !Array.isArray(data.elements) || data.elements.length <= 0) {
        clearHTML(container);
        renderEmptyList(root, container);
        return;
    }
    clearHTML(container);

    const sortedElements = sortElements(data.elements, state.elementList.filter.order);
    state.elementList.items = sortedElements;
    sortedElements.forEach(element => {
        let elementEl = buildElementPickerElement(root, element);
        container.appendChild(elementEl);
    });
}


function buildElementPickerElement(root, e) {
    if(!root || !e) return;

    let div         = root.createElement("div");
    div.className   = "element";
    div.dataset.action = "open-element-details";
    div.dataset.elementId = e.id;

    let header          = root.createElement("header");
    header.className    = "element-header";

    let img         = root.createElement("img");
    img.className   = "element-preview";
    img.alt         = "Preview Image";
    img.src         = e.image_path;

    let groupSpan       = root.createElement("span");
    groupSpan.className = "element-info-span";
    groupSpan.innerText = (e.elementegruppe ?? "-") + " G.";

    let valueSpan       = root.createElement("span");
    valueSpan.className = "element-info-span";
    valueSpan.innerText = (e.wertigkeit ?? "-") + " P.";

    let dismountSpan        = root.createElement("span");
    dismountSpan.className  = "element-info-span";
    dismountSpan.innerText  = "Abg.";

    let titleSpan       = root.createElement("span");
    titleSpan.className = "element-title";
    titleSpan.innerText = e.bezeichnung ?? "<not found>";

    let nameSpan        = root.createElement("span");
    nameSpan.className  = "element-name";
    nameSpan.innerText  = e.name ?? "-";

    let footerEl        = root.createElement("footer");
    footerEl.className  = "element-footer";

    let learnedSpan     = root.createElement("span");
    learnedSpan.className = e.learned ? "element-learned" : "element-not-learned";
    learnedSpan.innerText = e.learned ? "Gelernt" : "Nicht Gelernt";

    header.appendChild(groupSpan);
    header.appendChild(valueSpan);
    if(e.dismount) header.appendChild(dismountSpan);
    
    div.appendChild(header);
    div.appendChild(img);
    div.appendChild(titleSpan);
    if(e.name) div.appendChild(nameSpan);

    footerEl.appendChild(learnedSpan);
    div.appendChild(footerEl);

    return div;
}


function sortElements(elements, order) {
    const sorted = [...elements];
    sorted.sort((a, b) => {
        const groupA    = Number(a.elementegruppe ?? 0);
        const groupB    = Number(b.elementegruppe ?? 0);
        const valueA    = Number(String(a.wertigkeit ?? 0).replace(",", "."));
        const valueB    = Number(String(b.wertigkeit ?? 0).replace(",", "."));
        const nameA     = (a.bezeichnung ?? "").toLowerCase();
        const nameB     = (b.bezeichnung ?? "").toLowerCase();

        switch(order) {
            case 'group_up':
                return (groupA - groupB) || nameA.localeCompare(nameB, "de");
            case 'group_down':
                return (groupB - groupA) || nameA.localeCompare(nameB, "de");
            case 'value_up':
                return (valueA - valueB) || nameA.localeCompare(nameB, "de");
            case 'value_down':
                return (valueB - valueA) || nameA.localeCompare(nameB, "de");
            default:
                return nameA.localeCompare(nameB, "de");
        }
    });
    return sorted;
}


function renderEmptyList(root, container) {
    let p = root.createElement('p');
    p.innerText = "Keine Elemente gefunden";
    p.className = "routine-emtpy-msg";

    container.appendChild(p);
}


function renderElementListLoader(root, container) {
    let loaderContainer                 = root.createElement("div");
    loaderContainer.className           = "loader-container";
    loaderContainer.style.marginLeft    = "6%";

    let spinner         = root.createElement("div");
    spinner.className   = "spinner";

    loaderContainer.appendChild(spinner);
    container.appendChild(loaderContainer);

    showLoader(spinner);
}
