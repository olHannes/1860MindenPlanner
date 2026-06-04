import { clearHTML } from "../../panel-handling.js";
import { fetchCompetitionEntries } from "../api.js";


export function createCompetitionLeaderboardView(root, body, competition) {
    const ui = createCompetitionDetails(root, body, competition, (newSort) => {
        createCompetitionLeaderboard(root, ui.list, competition, newSort);
    });

    createCompetitionLeaderboard(root, ui.list, competition, ui.sortSelect.value);
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


async function createCompetitionLeaderboard(root, listEl, c, sortKey = "total") {
    if(!root ||!listEl || !c) return;

    clearHTML(listEl);

    const entries = await fetchCompetitionEntries({compId: c._id});
    if(!entries.entities || !Array.isArray(entries.entities) || entries.entities.length == 0) {
        const msg = root.createElement("p");
        msg.innerText = "Keine Einträge gefunden";
        msg.classList.add("competitionMsg");
        listEl.appendChild(msg);
        return;
    }
    const sorted = sortEntries(entries.entities, sortKey);

    sorted.forEach((e, idx) => {
        const metrics = calcEntryMetrics(e);
        const rank = (metrics.total > 0 && idx < 3) ? idx + 1 : 0;
        const entry = createCompetitionEntry(root, e, rank, metrics, sortKey);
        if(entry) listEl.appendChild(entry);
    });
}


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
