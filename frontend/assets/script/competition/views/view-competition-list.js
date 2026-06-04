import { clearHTML, hideLoader, showLoader } from "../../panel-handling.js";
import { fetchCompetitionList, joinCompetition, leaveCompetition } from "../api.js";
import { createCompetitionLeaderboardView } from "./view-competition-leaderboard.js";
import { showScoreForm } from "./view-competition-score.js";


export function bindCompetitionEvents(root) {
    const elementListContainer = root.querySelector("#competition-list");
    elementListContainer?.addEventListener("click", async (event) => {
        const target = event.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;
        console.log(action);

        const userId = localStorage.getItem("userId");
        const compId = target.dataset._id;

        let success = false;

        switch (action) {
            case 'join':
                const res_join = await joinCompetition({compId: compId});
                success = res_join.ok;
                break;
            
            case 'leave':
                const res_leave = await leaveCompetition({compId: compId});
                success = res_leave.ok;
                break;
            
            case 'startScore':
                showScoreForm(root, compId);
                break;
            
            default: 
                break;
        }

        if(success) renderCompetitionList(root);
    });
}


export async function renderCompetitionList(root) {
    const loader = root.querySelector("#panel3 .spinner");
    showLoader(loader);
    
    const container = root.querySelector("#competition-list");
    
    clearHTML(container);
    const comps = await fetchCompetitionList();

    if(!comps.ok || !Array.isArray(comps.competitions) || comps.competitions.length <= 0){
        const msg = root.createElement("p");
        msg.innerText = "Keine Wettkämpfe gefunden";
        msg.className = "competitionMsg";
        container.appendChild(msg);
        hideLoader(loader);
        return;
    }
    comps.competitions.forEach(competition => {
        let obj = buildCompetitionObject(root, competition);
        container.appendChild(obj);
    });

    hideLoader(loader);
}


function buildCompetitionObject(root, competition) {
    if(!root || !competition) return;
    const { date, isPast, joined, location, name, _id } = competition;

    const details = root.createElement("details");
    details.className = "comp-card";
    details.dataset.id = _id;

    if(isPast) details.classList.add("is-past");
    if(joined) details.classList.add("is-joined");


    const summary = root.createElement("summary");
    summary.classList.add("comp-summary");

    const titleRow = root.createElement("div");
    titleRow.className = "comp-row--title";

    const title = root.createElement("div");
    title.className = "comp-name";
    title.textContent = name ?? "Unbekannter Wettkampf";

    titleRow.appendChild(title);

    const metaRow = root.createElement("div");
    metaRow.classList.add("comp-row", "comp-row--meta");

    const locEl = root.createElement("span");
    locEl.className = "comp-location";
    locEl.textContent = location ?? "Ort unbekannt";

    const dateEl = root.createElement("span");
    dateEl.className = "comp-date";
    dateEl.textContent = date;

    metaRow.appendChild(locEl);
    metaRow.appendChild(dateEl);

    const statusRow = root.createElement("div");
    statusRow.classList.add("comp-row", "comp-row--status");

    const status = root.createElement("span");
    status.className = "comp-status";
    status.textContent = isPast ? "abgeschlossen" : "offen";

    statusRow.appendChild(status);

    const btn = getActionButton(root, competition);
    if(btn) statusRow.appendChild(btn);

    const scoreBtn = getScoreButton(root, competition);
    if(scoreBtn) statusRow.appendChild(scoreBtn);

    summary.appendChild(titleRow);
    summary.appendChild(metaRow);
    summary.appendChild(statusRow);

    const body = root.createElement("div");
    body.className = "comp-body";

    details.appendChild(summary);
    details.appendChild(body);

    createCompetitionLeaderboardView(root, body, competition);

    return details;
}


function getActionButton(root, competition) {
    if (competition.isPast) return null;
    const btn = root.createElement("button");
    btn.classList.add(competition.joined ? "comp-leave" : "comp-join", "comp-btn");
    btn.dataset.action = competition.joined ? "leave" : "join";
    btn.dataset._id = competition._id;
    btn.innerText = competition.joined ? "Verlassen" : "Beitreten";
    return btn;
}


function getScoreButton(root, competition) {
    if(competition.isPast || !competition.joined) return null;
    const btn = root.createElement("button");
    btn.classList.add("comp-join", "comp-btn");
    btn.dataset.action = competition.joined ? "startScore" : "join";
    btn.dataset._id = competition._id;
    btn.innerText = competition.joined ? "Punkte aktualisieren" : "Beitreten";
    return btn;
}
