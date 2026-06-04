import { NewsElements } from "../../config.js";
import { clearHTML, hide, hideFloatingBackground, show, showFloatingBackground } from "../../panel-handling.js";


export function bindNewsEvents(root) {
    const container = root.querySelector("#news");
    container?.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if(!actionEl) return;
        const action = actionEl.dataset.action;
        console.log("action: ", action);
        if(action === "close-news") {
            hideNews(root);

        }
    });
}

export function showNews(root) {
    const newsPage = root.querySelector("#news");
    const mainPage = root.querySelector("#mainPage");
    showFloatingBackground(root);
    show(newsPage, "flex");
    hide(mainPage);
}

function hideNews(root) {
    const newsPage = root.querySelector("#news");
    const mainPage = root.querySelector("#mainPage");
    hideFloatingBackground(root);
    hide(newsPage);
    show(mainPage, "flex");
}



export function renderNews(root) {
    const newsContainer = root.querySelector("#news");
    clearHTML(newsContainer);
    newsContainer.appendChild(buildHeadline(root));
    newsContainer.appendChild(buildSubHeadline(root));
    newsContainer.appendChild(buildElementList(root));
    newsContainer.appendChild(buildCloseButton(root));
}

function buildElementList(root) {
    const list = root.createElement("ul");
    NewsElements.forEach(element => {
        list.appendChild(buildNewsEntry(root, element));
    });
    return list;
}

function buildNewsEntry(root, element) {
    const item = root.createElement("li");
    item.innerHTML = `<strong>${element.label}:</strong> ${element.value}`;
    return item;
}


function buildSubHeadline(root) {
    const subHeadline = root.createElement("p");
    subHeadline.innerText = "Die neusten Features seit dem letzten Update";
    subHeadline.className = "news__subheadline";
    return subHeadline;
}

function buildHeadline(root) {
    const headline = root.createElement("h2");
    headline.innerText = "Neuigkeiten & Updates";
    headline.className = "news__headline";
    return headline;
}

function buildCloseButton(root) {
    const closeBtnEl = root.createElement("button");
    closeBtnEl.id = "closeNews";
    closeBtnEl.className = "hide-download-btn cancel-btn";
    closeBtnEl.innerText = "News schließen";
    closeBtnEl.dataset.action = "close-news";
    return closeBtnEl;
}