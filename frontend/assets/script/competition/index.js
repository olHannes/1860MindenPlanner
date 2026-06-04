import { bindCompetitionEvents, renderCompetitionList } from "./views/view-competition-list.js";
import { bindCompetitionScoreEvents } from "./views/view-competition-score.js";

export function initCompetitionFeature(root) {
    if(!root) return;

    bindCompetitionEvents(root);
    bindCompetitionScoreEvents(root);
}

export function startFeature(root) {
    renderCompetitionList(root);
}