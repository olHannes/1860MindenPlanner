import { DownloadSubfolder, DownloadElements } from "../../config.js";
import { clearHTML, hide, hideFloatingBackground, show, showFloatingBackground } from "../../panel-handling.js";


export function bindDownloadEvents(root) {
    const container = root.querySelector("#downloadPage");
    container?.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if(!actionEl) return;
        const action = actionEl.dataset.action;
        console.log("action: ", action);
        if(action === "close-downloads") {
            hideDownloads(root);
            
        }
    });
}


export function renderDownloads(root) {
    const downloadsContainer = root.querySelector("#downloadPage");
    clearHTML(downloadsContainer);
    downloadsContainer.appendChild(buildHeadline(root));

    const groupedDownloads = groupDownloads(DownloadElements);

    Object.entries(groupedDownloads).forEach(([group, elements]) => {
        downloadsContainer.appendChild(
            buildDownloadGroup(root, group, elements)
        );
    });
    downloadsContainer.appendChild(buildCloseButton(root));
}


function groupDownloads(elements) {
    return elements.reduce((groups, element) => {
        const group = element.group ?? "Sonstiges";

        if (!groups[group]) { groups[group] = []; }

        groups[group].push(element);
        return groups;
    }, {});
}


export function showDownloads(root) {
    const downloadPanel = root.querySelector("#downloadPage");
    showFloatingBackground(root);
    show(downloadPanel, "block");
}

export function hideDownloads(root) {
    const downloadPanel = root.querySelector("#downloadPage");
    hideFloatingBackground(root);
    hide(downloadPanel);
}


function buildDownloadGroup(root, group, elements) {
    const details = root.createElement("details");
    details.className = "download-group";
    details.open = false;

    const summary = root.createElement("summary");
    summary.className = "download-group__summary";
    summary.innerText = group;

    const content = root.createElement("div");
    content.className = "download-group__content";

    elements.forEach(element => {
        content.appendChild(buildDownloadComponent(root, element));
    });

    details.appendChild(summary);
    details.appendChild(content);

    return details;
}


function buildDownloadComponent(root, element) {
    const wrapper = root.createElement("div");
    wrapper.className = "download--item";

    wrapper.innerHTML = `
        <header class="horizontal-container">
            <h3>${element.label ?? "<unbekannt>"}</h3>
            <span class="icon icon--pdf"></span>
        </header>
        <a href="${DownloadSubfolder + element.value}" class="download-btn" download>Download PDF</a>
    `;
    return wrapper;
}


function buildHeadline(root) {
    const headline = root.createElement("h2");
    headline.innerText = "Hier findest du die Tabellen zum Download";
    headline.className = "download__headline";
    return headline;
}

function buildCloseButton(root) {
    const closeBtnEl = root.createElement("button");
    closeBtnEl.id = "closeDownloadBtn";
    closeBtnEl.className = "hide-download-btn cancel-btn";
    closeBtnEl.innerText = "Downloads schließen";
    closeBtnEl.dataset.action = "close-downloads";
    return closeBtnEl;
}