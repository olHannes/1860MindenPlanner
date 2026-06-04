import { StartMessage } from "../config.js";
import { bindStartEvents } from "./events.js";
import { bindDownloadEvents, renderDownloads } from "./views/downloads_view.js";
import { bindNewsEvents, renderNews } from "./views/news_view.js";


export function initStartFeature(root) {
    renderWelcomeText(root);
    renderDownloads(root);
    renderNews(root);

    bindStartEvents(root);
    bindDownloadEvents(root);
    bindNewsEvents(root);
    
}


function renderWelcomeText(root) {
    const welcomeTxt = root.querySelector("#welcomeTxt");
    if(welcomeTxt) welcomeTxt.innerHTML = StartMessage;
}