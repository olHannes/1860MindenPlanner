
import { APPARATUS } from "../../config.js";
import { fetchExercise } from "../../exercise/api.js";
import { hide, hideFloatingBackground, show, showFloatingBackground } from "../../panel-handling.js";


export function bindMemberRoutineEvents(root) {
    const container = root.querySelector("#panel2");
    container?.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if(!actionEl) return;
        const action = actionEl.dataset.action;
        console.log("action: ", action);
        
        if(action === "start-rating") {
            showRatingPanel(
                root, 
                actionEl.dataset.targetUser, 
                actionEl.dataset.apparatus
            );

        }
    });
}

function showRatingPanel(root, targetUserId, apparatus) {
    const container = root.querySelector("#ratingRoutine");
    show(container, "block");
    showFloatingBackground(root);
    const submitBtn = root.querySelector("#submitRatingBtn");
    submitBtn.dataset.targetUser = targetUserId;
    submitBtn.dataset.apparatus = apparatus;
}

export function hideRatingPanel(root) {
    const container = root.querySelector("#ratingRoutine");
    hide(container);
    hideFloatingBackground(root);
}


export async function buildUserContent(root, userId, detailsContainer) {
    if(!userId || !root || !detailsContainer) return;

    const routines = await Promise.all(
        APPARATUS.map(async (apparatus) => {
            const routine = await fetchExercise({userId: userId, apparatusId: apparatus.id, routineType: 0});
            return { apparatus, routine };
        })
    );
    const filtered = routines.filter(({ routine }) => routine?.exercise?.elemente?.length > 0)

    if(filtered.length === 0) {
        detailsContainer.innerHTML = "<p>Dieser Benutzer hat noch keine Übungen angelegt.</p>";
        return;
    }
    detailsContainer.innerHTML = filtered
        .map(({ apparatus, routine }) => `
            <details class="member-apparatus--list">
                <summary>
                    <img src="${apparatus.icon}" alt="">
                    <h3>${apparatus.nameDe}</h3>
                </summary>

                ${
                    routine?.exercise?.elemente?.length
                        ? `
                            <ol class="member-routine--list">
                                ${routine.exercise.elemente.map((el, index) => `
                                    <li>
                                        <span>${index+1}</span>
                                        <img src="${el.image_path}" alt="${el.id}">
                                        <div>
                                            <p>${el.bezeichnung}</p>
                                            <span>${el.name}</span>
                                        </div>
                                    </li>
                                `).join("")}
                            </ol>
                        `
                        : `<p>Noch keine Übung vorhanden.</p>`
                }
                ${buildRatingButton(routine?.exercise?.userId, apparatus.id)}
            </details>
        `).join("");
}


function buildRatingButton(targetUser, apparatus) {
    if (!targetUser || !apparatus) return "";

    return `
        <button 
            class="cancel-btn"
            data-action="start-rating"
            data-targetUser="${targetUser}"
            data-apparatus="${apparatus}">
            Übung bewerten
        </button>
    `;
}