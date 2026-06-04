import { showMessage } from "../../panel-handling.js";
import { fetchRateRoutine } from "../api.js";
import { hideRatingPanel } from "./view-member-routine.js";


export function bindMemberRatingEvents(root) {
    const container = root.querySelector("#ratingRoutine");
    container?.addEventListener("click", (e) => {

        const starEl = e.target.closest(".star");
        console.log(starEl);
        if(starEl) {
            const rating = Number(starEl.dataset.index);
            setRating(container, rating);
            return;
        }

        const actionEl = e.target.closest("[data-action]");
        if(!actionEl) return;
        const action = actionEl.dataset.action;
        console.log("action: ", action);
        
        if(action === "cancel-rating") {
            hideRatingPanel(root);

        } else if(action === "submit-rating") {
            const targetUser = actionEl.dataset.targetUser;
            const apparatus = actionEl.dataset.apparatus;
            const rating = Number(container.dataset.rating);
            submitRating(root, targetUser, apparatus, rating);

        }
    });
}

function setRating(container, rating) {
    if (!rating || rating < 1 || rating > 5) return;
    container.dataset.rating = rating;

    container.querySelectorAll(".star").forEach((star) => {
        const index = Number(star.dataset.index);
        star.innerHTML = index <= rating ? "★" : "☆";
    });
}


async function submitRating(root, targetUser, apparatus, rating) {
    if (!root || !targetUser || !apparatus || !rating) {
        showMessage(root, "Bewertung fehlt", "Bitte wähle zuerst 1 bis 5 Sterne aus.");
        return;
    }

    const result = await fetchRateRoutine({
        targetUserId: targetUser,
        apparatus: apparatus,
        rating: rating
    });
    showMessage(root, result.ok ? "Bewertung erfolgreich" : "Bewertung fehlgeschlagen", result.ok ? "Die Bewertung wurde erfolgreich gespeichert." : "Die Bewerung konnte nicht gespeichert werden.");

    if(result.ok) {
        hideRatingPanel(root);
    }
}