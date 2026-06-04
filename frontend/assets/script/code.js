
import * as config from "./config.js";
import * as eventListener from "./eventlistener.js";
import * as userHandling from "./user-handling.js";
import * as panel from "./panel-handling.js";

import * as exercise from "./exercise/index.js";
import * as settings from "./settings/index.js";
import * as members from "./member/index.js";
import * as competition from "./competition/index.js";
import { initStartFeature } from "./start/index.js";
import { loadCsrfToken, getCsrfToken } from "./base_api.js";



window.onload = async function () {
    userHandling.startup(this.document);
    
    await userHandling.requireAuth();
    await loadCsrfToken();

    initStartFeature(this.document);

    exercise.initExerciseFeature(this.document);
    settings.initSettingsFeature(this.document);
    competition.initCompetitionFeature(this.document);
    members.initMemberFeature(this.document);

    eventListener.addFunktionalEventListener(document);
};
