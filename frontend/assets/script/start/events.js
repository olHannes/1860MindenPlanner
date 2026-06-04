import { showDownloads } from "./views/downloads_view.js";
import { showNews } from "./views/news_view.js";

export function bindStartEvents(root) {
    const container = root.querySelector("#panelRoot");
    container?.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if(!actionEl) return;
        const action = actionEl.dataset.action;
        console.log("action: ", action);
        
        if(action === "open-downloads") {
            showDownloads(root);

        } else if(action === "open-news") {
            showNews(root);

        }
    });
}