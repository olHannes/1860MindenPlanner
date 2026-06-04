import { renderUsers } from "./views/view-member-list.js";
import { bindMemberRoutineEvents } from "./views/view-member-routine.js";
import { bindMemberRatingEvents } from "./views/view-routine-rating.js";


export function initMemberFeature(root) {
    bindMemberRoutineEvents(root);
    bindMemberRatingEvents(root);
}

export function startMemberFeature(root) {
    renderUsers(root);
}