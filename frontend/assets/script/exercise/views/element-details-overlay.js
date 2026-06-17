import { showFloatingBackground, showMessage } from "../../panel-handling.js";
import { VIEWS } from "../constants.js";
import { state } from "../state.js";
import { showView } from "./navigation.js";
import { markElementAsLearned, removeLearnedElement } from "../api.js";

import { addElementToRoutine } from "./routine-editor.js";


export function setupElementDetailEvents(root) {
    const elementDetailsContainer = root.querySelector("#view-details-overlay");
    elementDetailsContainer?.addEventListener("click", async (event) => {
        const target = event.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;

        const elemId = target.dataset.elementId;

        switch (action) {
            case 'close-element-details':
                closeElementDetailsOverlay(root);
                break;
        
            case 'prev-element-detail':
                showPrevElementDetail(root);
                break;

            case 'next-element-detail':
                showNextElementDetail(root);
                break;

            case 'add-element-to-routine':
                const id = target.dataset.elementId;
                if(!id) return;
                let element = state.elementDetails.elements.find(item => String(item.id) === String(id));
                if(!element) return;

                addElementToRoutine(root, element);
                showMessage(root, "Element zur Übung hinzugefügt", "Übung wurde aktualisiert");
                renderElementDetailsOverlay(root);
                break;
            
            case 'mark-element-learned':
                const resMarkLearned = await markElementAsLearned({ elementId: elemId });
                if(resMarkLearned.ok) {
                    target.dataset.action = "remove-element-learned";
                    target.innerText = "'gelernt' entfernen";
                    showMessage(root, "Element aktualisiert", "Element als 'gelernt' markiert.");
                }
                break;
            
            case "remove-element-learned":
                const resRemoveLearned = await removeLearnedElement({ elementId: elemId });
                if(resRemoveLearned.ok) {
                    target.dataset.action = "mark-element-learned";
                    target.innerText = "Element als 'gelernt' markieren";
                    showMessage(root, "Element aktualisiert", "gelerntes Element entfernt.");
                }
                break;

            default:
                break;
        }
    });
}


export function openElementDetailsOverlay(root, elements, startIndex = 0, options = {}) {
    if(!root || !Array.isArray(elements) || elements.length === 0) return;
    if(startIndex < 0 || startIndex >= elements.length) return;

    state.elementDetails.isOpen = true;
    state.elementDetails.elements = elements;
    state.elementDetails.currentIndex = startIndex;
    state.elementDetails.returnView = options.returnView ?? VIEWS.ELEMENT_LIST;
    state.elementDetails.source = options.source ?? "element-list";
    state.elementDetails.startX = 0;
    state.elementDetails.currentTranslatePx = 0;
    state.elementDetails.baseTranslatePx = 0;
    state.elementDetails.isDragging = false;

    showElementDetailsOverlay(root);

    requestAnimationFrame(() =>{  
        renderElementDetailsOverlay(root);
    });
}


function showElementDetailsOverlay(root) {
    showView(root, VIEWS.ELEMENT_DETAILS);
}


export function closeElementDetailsOverlay(root) {
    const returnView = state.elementDetails.returnView ?? VIEWS.ELEMENT_LIST;

    state.elementDetails.isOpen = false;
    state.elementDetails.elements = [];
    state.elementDetails.currentIndex = 0;
    state.elementDetails.returnView = VIEWS.ELEMENT_LIST;
    state.elementDetails.source = "element-list";

    state.elementDetails.startX = 0;
    state.elementDetails.currentTranslatePx = 0;
    state.elementDetails.baseTranslatePx = 0;
    state.elementDetails.isDragging = false;

    showView(root, returnView);
}


export function showNextElementDetail(root) {
    const {currentIndex, elements } = state.elementDetails;
    if(currentIndex >= elements.length -1) return;

    state.elementDetails.currentIndex += 1;
    updateElementDetailsPosition(root);
}


export function showPrevElementDetail(root) {
    const { currentIndex } = state.elementDetails;
    if(currentIndex <= 0) return;

    state.elementDetails.currentIndex -= 1;
    updateElementDetailsPosition(root);
}





function createElementDetailCard(element, index) {
    const learnedLabel = element.learned ? "'gelernt' entfernen" : "Element als 'gelernt' markieren";
    const addLabel = "Zur Übung hinzufügen";

    return `
        <article class="element-detail-card" data-index="${index}">
            <div class="element-detail-card__surface">
                <header class="element-detail-card__header">
                    <div>
                        <h2 class="element-detail-card__title">${element.bezeichnung ? element.bezeichnung.slice(0, 35)+"..." : "<not found>"}</h2>
                        <div class="element-detail-card__subtile muted">${element.name ?? "-"}</div>
                    </div>
                    <div class="element-detail-card__badges">
                        <span class="badge">Elementegruppe: ${element.elementegruppe ?? "-"}</span>
                        <span class="badge">Schwierigkeit: ${element.wertigkeit ?? "-"}</span>
                    </div> 
                </header>

                <section class="element-detail-card__media">
                    ${element.image_path ? `<img src="${element.image_path}" alt="${element.bezeichnung ?? "Element"}" loading="eager" decoding="async">` : ""}
                </section>

                <section class="element-detail-card__content">
                    <div>
                        <h3>Beschreibung</h3>
                        <p>${element.bezeichnung ?? "Keine Beschreibung vorhanden."}</p>
                    </div>

                    <div>
                        <h3>Details</h3>
                        <div class="element-detail-card__facts">
                            <div><strong>Gruppe:</strong> ${element.elementegruppe ?? "-"}</div>
                            <div><strong>Schwierigkeit:</strong> ${element.wertigkeit ?? "-"}</div>
                            <div><strong>Status:</strong> ${element.learned ? "Gelernt" : "Noch nicht gelernt"}</div>
                            <div><strong>Abgang:</strong> ${element.dismount ? "Ja": "Nein"}</div>
                        </div>
                    </div>
                </section>

                <footer class="element-detail-card__actions">
                    <button class="btn--primary" type="button"
                        data-action="add-element-to-routine" data-element-id="${element.id}">
                        ${addLabel}
                    </button>

                    <button class="btn--secondary" type="button"
                        data-action="${element.learned ? "remove-element-learned" : "mark-element-learned"}" data-element-id="${element.id}">
                        ${learnedLabel}
                    </button>
                </footer>
            </div>
        </article>
    `;
}


export function renderElementDetailsOverlay(root) {
    const overlay = root.querySelector("#view-details-overlay");
    if(!overlay) return;

    const track = overlay.querySelector("#element-details-track");
    if(!track) return;

    const prevBtn = overlay.querySelector("[data-action='prev-element-detail']");
    const nextBtn = overlay.querySelector("[data-action='next-element-detail']");

    const { elements, currentIndex, currentTranslatePx } = state.elementDetails;
    if(!Array.isArray(elements) || elements.length === 0) return;

    track.innerHTML = elements
        .map((element, index) => createElementDetailCard(element, index))
        .join("");

    const viewport = overlay.querySelector(".slider-viewport");
    const slideWidth = viewport?.clientWidth ?? 0;

    const offset = -(currentIndex * slideWidth) + (currentTranslatePx ?? 0);
    track.style.transform = `translateX(${offset}px)`;

    if(prevBtn) prevBtn.disabled = currentIndex === 0;
    if(nextBtn) nextBtn.disabled = currentIndex === elements.length - 1;
}


function updateElementDetailsPosition(root) {
    const overlay = root.querySelector("#view-details-overlay");
    const track = root.querySelector("#element-details-track");
    const viewport = root.querySelector(".slider-viewport");

    if(!overlay || !track || !viewport) return;

    const { currentIndex, currentTranslatePx, elements } = state.elementDetails;
    const slideWidth = viewport.clientWidth;

    track.style.transform = `translateX(${-currentIndex*slideWidth+(currentTranslatePx ?? 0)}px)`;

    const prevBtn = overlay.querySelector("[data-action='prev-element-detail']");
    const nextBtn = overlay.querySelector("[data-action='next-element-detail']");

    if(prevBtn) prevBtn.disabled = currentIndex === 0;
    if(nextBtn) nextBtn.disabled = currentIndex === elements.length -1;
}
