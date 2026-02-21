import * as panel from "./panel-handling.js";
import * as config from "./config.js";


export async function reloadCompetitions(root) {
    const loader = root.querySelector("#panel3 .spinner");
    const comps = await loadcompetitions(loader, localStorage.getItem("userId")); 
    renderCompetitionList(root, comps);
}


async function loadcompetitions(loader, userId) {
    try {
        panel.showLoader(loader);
        let fetchUrl = `${config.serverURL}/competition/all`;
        if(userId) fetchUrl += `?userId=${userId}`;
        const res = await fetch(fetchUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if(data.ok) return data.competitions;
        return [];
    } catch (error) {
        console.error("Failed to load competitions:", error);
        return [];
    } finally {
        panel.hideLoader(loader);
    }
}

async function loadCompetitionDetails(id, loader) {
    if(!id) return {};
    try {
        panel.showLoader(loader);
        const res = await fetch(`${config.serverURL}/competition/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if(data.ok) return data.competition;
        return {};
    } catch (error) {
        console.error("Failed to load competition details:", error);
        return {};
    } finally {
        panel.hideLoader(loader);
    }
}

async function loadCompetitionResult(id, loader) {
    if(!id) return;
    try {
        panel.showLoader(loader);
        const res = await fetch(`${config.serverURL}/competition/${id}/entries`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if(data.ok) return data.entities;
        return [];
    } catch (error) {
        console.error("Failed to load competition result:", error);
        return [];
    } finally {
        panel.hideLoader(loader);
    }
}


async function joinCompetition(compId) {
    const userId = localStorage.getItem("userId");
    if(!compId ||!userId) return;
    try {
        const res = await fetch(`${config.serverURL}/competition/${compId}/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId})
        });
        const data = await res.json();
        if(data.ok) return true;
        return false;
    } catch (error) {
        console.error("Failed to join competition:", error);
        return false;
    }
}
async function leaveCompetition(compId) {
    const userId = localStorage.getItem("userId");
    if(!compId || !userId) return;
    try {
        const res = await fetch(`${config.serverURL}/competition/${compId}/leave`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId })
        });
        const data = await res.json();
        if(data.ok) return true;
        return false;
    } catch (error) {
        console.error("Failed to leave competition", error);
        return false;
    }
}

async function submitResults(compId, userId, device, value) {
    if(!compId || !userId || !device || !value) return;
    if(!config.device.hasOwnProperty(device)) {
        console.error("Invalid device:", device);
        return false;
    }
    if(value <= 0) {
        console.error("Invalid value");
        return false;
    }
    try {
        const res = await fetch(`${config.serverURL}/competition/${compId}/points`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, device: device, points: value })
        });
        const data = await res.json();
        if(data.ok) return true;
        return false;
    } catch (error) {
        console.error("Failed to put competition points:", error);
        return false;
    }
}

function submitCompetitionPoints(root, compId) {
    const userId = localStorage.getItem("userId");
    if(!root || !compId || !userId) return;

}


export function addCompetitionEventListener(root, loader) {
    const container = root.getElementById("competition-list");
    if(!container) return;
    container.addEventListener("click", async (e) => {
        const btn = e.target.closest(".comp-btn");
        if(!btn) return;
        const compId = btn.dataset._id;
        const action = btn.dataset.action;

        let success = false;
        if(action === "join") {
            success = await joinCompetition(compId);
        } else if(action === "leave") {
            success = await leaveCompetition(compId);
        } else if(action === "submitPoints") {
            success = submitCompetitionPoints(root, compId);
        }

        if(!success) return;
        const comps = await loadcompetitions(null, localStorage.getItem("userId"));
        renderCompetitionList(root, comps);
    })
}


function createCompetitionEntry(root, e, rank = 0, metrics = null, sortKey = "total") {
    if(!root || !e) return null;

    const container = root.createElement("div");
    container.classList.add("comp-entry");

    const icon = root.createElement("span");
    icon.classList.add("icon", "icon--rank", `icon--rank-${rank}`);

    const name = root.createElement("p");
    name.classList.add("comp-entry--name");
    name.innerText = e.userName ?? "unbekannt";

    if(!metrics) metrics = calcEntryMetrics(e);

    let valueText = "";
    if(sortKey === "average") {
        valueText = `Ø ${metrics.average.toFixed(1)}`;
    } else if(sortKey === "devices") {
        valueText = `${metrics.devices} Geräte`;
    } else {
        valueText = `${metrics.total} Punkte`;
    }

    const value = root.createElement("p");
    value.classList.add("comp-entry--value");
    value.innerText = valueText;

    const points = root.createElement("div");
    points.classList.add("comp-entry--points");

    const scoreList = root.createElement("ul");
    if(e.scores && e.scores && typeof e.scores === "object") {
        Object.entries(e.scores).forEach(([device, value]) => {
            if(value) {
                const li = root.createElement("li");
                li.innerText = `${device}: ${value}`;
                scoreList.appendChild(li);
            }
        })
    }

    points.appendChild(name);
    points.appendChild(value);
    points.appendChild(scoreList);

    container.appendChild(points);
    
    container.appendChild(icon);
    return container;
}

async function createCompetitionLeaderboard(root, listEl, c, sortKey = "total") {
    if(!root ||!listEl || !c) return;

    panel.clearHTML(listEl);

    const entries = await loadCompetitionResult(c._id);
    if(!entries || !Array.isArray(entries) || entries.length == 0) {
        const msg = root.createElement("p");
        msg.innerText = "Keine Einträge gefunden";
        msg.classList.add("competitionMsg");
        listEl.appendChild(msg);
        return;
    }
    const sorted = sortEntries(entries, sortKey);

    sorted.forEach((e, idx) => {
        const metrics = calcEntryMetrics(e);

        const rank = (metrics.total > 0 && idx < 3) ? idx + 1 : 0;
        
        const entry = createCompetitionEntry(root, e, rank, metrics, sortKey);
        if(entry) listEl.appendChild(entry);
    });
}


function getActionButton(root, c) {
    if (c.isPast) return null;

    const btn = root.createElement("button");
    btn.classList.add(c.joined ? "comp-leave" : "comp-join", "comp-btn");
    btn.dataset.action = c.joined ? "leave" : "join";
    btn.dataset._id = c._id;
    btn.innerText = c.joined ? "Verlassen" : "Beitreten";
    return btn;
}


function createCompetitionDetails(root, body, c, onSortChange) {
    if(!root || !body || !c) return;

    const header = root.createElement("header");
    header.classList.add("comp-body--header");

    const title = root.createElement("h4");
    title.innerText = "🏆 Rangliste";
    title.classList.add("comp-leaderboard--title");

    const sortType = root.createElement("label");
    sortType.classList.add("comp-leaderboard--sort");

    const sortTitle = root.createElement("p");
    sortTitle.classList.add("comp-leaderboard--type");
    sortTitle.innerText = "Sortierung:";

    const sortSelect = root.createElement("select");
    sortSelect.classList.add("comp-leaderboard--select");
    sortSelect.innerHTML = `
        <option value="total" class="comp-leaderboard--option">Gesamtpunkte</option>
        <option value="average">Durchschnitt</option>
        <option value="devices">Geräte-Anzahl</option>
    `;
    sortSelect.value = "total";
    sortSelect.addEventListener("change", () => {
        if(typeof onSortChange === "function") onSortChange(sortSelect.value);
    });

    sortType.appendChild(sortTitle);
    sortType.appendChild(sortSelect);

    header.appendChild(title);
    header.appendChild(sortType);

    const list = root.createElement("div");
    list.classList.add("comp-leaderboard--list");
    
    body.appendChild(header);
    body.appendChild(list);
    return { sortSelect, list };
}


function createCompetitionObject(root, c) {
    if(!c) return;
    const { date, isPast, joined, location, name, _id } = c;

    // --- outer container ---
    const details = root.createElement("details");
    details.classList.add("comp-card");
    details.dataset.id = _id;

    if(isPast) details.classList.add("is-past");
    if(joined) details.classList.add("is-joined");

    // --- summary ---
    const summary = root.createElement("summary");
    summary.classList.add("comp-summary");

    // line 1
    const titleRow = root.createElement("div");
    titleRow.classList.add("comp-row--title");

    const title = root.createElement("div");
    title.classList.add("comp-name");
    title.textContent = name ?? "Unbekannter Wettkampf";

    titleRow.appendChild(title);

    // line 2
    const metaRow = root.createElement("div");
    metaRow.classList.add("comp-row", "comp-row--meta");

    const locEl = root.createElement("span");
    locEl.classList.add("comp-location");
    locEl.textContent = location ?? "Ort unbekannt";

    const dateEl = root.createElement("span");
    dateEl.classList.add("comp-date");
    dateEl.textContent = date;

    metaRow.appendChild(locEl);
    metaRow.appendChild(dateEl);

    // line 3
    const statusRow = root.createElement("div");
    statusRow.classList.add("comp-row", "comp-row--status");

    const status = root.createElement("span");
    status.classList.add("comp-status");
    status.textContent = isPast ? "abgeschlossen" : "offen";

    statusRow.appendChild(status);

    const btn = getActionButton(root, c);
    if(btn) statusRow.appendChild(btn);

    summary.appendChild(titleRow);
    summary.appendChild(metaRow);
    summary.appendChild(statusRow);

    const body = root.createElement("div");
    body.classList.add("comp-body");

    details.appendChild(summary);
    details.appendChild(body);

    const ui = createCompetitionDetails(root, body, c, (newSort) => {
        createCompetitionLeaderboard(root, ui.list, c, newSort);
    });
    createCompetitionLeaderboard(root, ui.list, c, ui?.sortSelect?.value ?? "total");

    return details;
}

function renderCompetitionList(root, competitionList) {
    const container = root.getElementById("competition-list");
    if(!container) return;
    panel.clearHTML(container);
    if(!competitionList || !Array.isArray(competitionList) || competitionList.length == 0) {
        const msg = root.createElement("p");
        msg.innerText = "Keine Wettkämpfe gefunden";
        msg.classList.add("competitionMsg");
        container.appendChild(msg);
        return;
    }
    competitionList.forEach(c => {

        let obj = createCompetitionObject(root, c);
        container.appendChild(obj);

    });
}



/////////////////////////////////////////////////////
//  Helper Functions
/////////////////////////////////////////////////////
function calcEntryMetrics(e) {
    const scores = (e && e.scores && typeof e.scores == "object") ? e.scores : {};
    const values = Object.values(scores).filter(v => typeof v === "number" && v > 0);
    
    const total = values.reduce((a, b) => a + b, 0);
    const devices = values.length;
    const average = devices > 0 ? total / devices : 0;

    return { total, devices, average };
}

function getMetricValue(metrics, sortKey) {
    if (sortKey === "average") return metrics.average;
    if (sortKey === "devices") return metrics.devices;
    return metrics.total;
}
/*
function calcEntryMetric(e, sortKey) {
    const scores = (e && e.scores && typeof e.scores == "object") ? e.scores : {};
    const values = Object.values(scores).filter(v => typeof v === "number" && v > 0);

    const total = values.reduce((a, b) => a + b, 0);
    const devices = values.length;
    const average = devices > 0 ? total / devices : 0;

    if(sortKey === "average") return average;
    if(sortKey === "devices") return devices;
    return total; //default
}
*/
function sortEntries(entries, sortKey) {
    const arr = Array.isArray(entries) ? [...entries] : [];

    return arr.sort((a, b) => {
        const ma = calcEntryMetrics(a);
        const mb = calcEntryMetrics(b);

        const va = getMetricValue(ma, sortKey);
        const vb = getMetricValue(mb, sortKey);

        if (vb !== va) return vb - va;

        const ua = (a?.userName ?? "").toLowerCase();
        const ub = (b?.userName ?? "").toLowerCase();
        return ua.localeCompare(ub);
    });
}