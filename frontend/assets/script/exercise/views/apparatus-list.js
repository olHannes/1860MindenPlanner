
import { APPARATUS } from "../../config.js";
import { VIEWS } from "../constants.js";
import { renderApparatusDetail } from "./apparatus-detail.js";
import { showView } from "./navigation.js";

export function setupUIEvents(root) {
    const apparatusListContainer = root.querySelector("#view-apparatus-list");
    apparatusListContainer?.addEventListener("click", (event) => {
        const target = event.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;

        switch (action) {
            case 'open-detail':
                const id = target.dataset.apparatusId;
                if(!id) return;
                renderApparatusDetail(root, id);
                showView(root, VIEWS.APPARATUS_DESC);
                break;
        
            default:
                break;
        }
    });
}


export function renderApparatusCards(root, apparatusList) {
    if(!root || !apparatusList || !Array.isArray(apparatusList)) return;
    
    const container = root.querySelector('#apparatus-container');
    if(!container) return;
    
    const cardList = apparatusList.map(a => `
        <button 
            class="apparatus-card" type="button" 
            data-action="open-detail" data-apparatus-id="${a.id}"
            aria-label="Öffne Details: ${a.nameDe}"
        >
            <div class="name-container">
                <h2 class="name-de">${a.nameDe}</h2>
                <h3 class="name-en">${a.nameEn}</h3>
            </div>
            <img src="${a.icon}" alt="${a.nameEn}" class="apparatus-image">
        </button>
        `).join("");
    container.innerHTML = cardList;
}