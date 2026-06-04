
import * as config from "../config.js";

import { renderApparatusCards } from "./views/apparatus-list.js";
import { renderFilterElements } from "./views/element-list.js";

import { bindExerciseEvents } from "./events.js";
import { bindElementFilterEvents } from "./filter.js";

import { VIEWS } from "./constants.js";
import { showView } from "./views/navigation.js";
import { bindSecurityEvents } from "../settings/views/view-security-settings.js";


export function initExerciseFeature(root) {
    if(!root) return;
    renderApparatusCards(root, config.APPARATUS);
    renderFilterElements(root, config.FilterElements);

    bindExerciseEvents(root);
    bindElementFilterEvents(root);
    bindSecurityEvents(root);

    showView(root, VIEWS.APPARATUS_LIST);
}
