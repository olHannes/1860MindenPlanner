import { clearHTML, hideLoader, showLoader } from "../../panel-handling.js";
import { fetchAllUser } from "../api.js";
import { buildUserContent } from "./view-member-routine.js";


export async function renderUsers(root) {
    const loader = root.querySelector("#panel2 .spinner");
    showLoader(loader);

    try {
        const result = await fetchAllUser();
        buildUserList(root, result.users ?? []);
    } catch (error) {
        console.error("Failed to load members:", error);
    } finally {
        hideLoader(loader);
    }
}

function buildUserList(root, users) {
    const container = root.querySelector("#member-list");
    clearHTML(container);

    users.forEach(user => {
        const entry = buildUserEntry(root, user);
        container.appendChild(entry);
    });
}



function buildUserEntry(root, user) {
    const details = root.createElement("details");
    details.className = "member-entry";
    details.dataset.id = user._id;

    const summary = root.createElement("summary");
    summary.className = "member-unit";

    const info = root.createElement("div");
    info.className = "member-info";

    const body = root.createElement("div");
    body.className = "details-body";
    body.innerHTML = `<p>${user.firstName + " " + user.lastName}</p>`;

    const img = root.createElement("img");
    img.src = "assets/images/system/profile_icon.png";
    img.alt = "Profile Icon";
    img.style.filter = `drop-shadow(0px 0px 5px ${user.color_code})`;

    const nameContainer = root.createElement("div");
    nameContainer.className = "name-container";
    nameContainer.innerHTML = `
        <span class="nameBig">${user.firstName}</span>
        <span class="nameLight">${user.lastName}</span>
    `;

    const status = root.createElement("span");
    status.className = "member-status";
    status.title = user.online ? 'Online' : 'Offline';
    status.style.background = user.online ? 'linear-gradient(315deg, #08300c, #28bf40f5)' : 'gray';

    info.append(img, nameContainer);
    summary.append(info, status);
    details.append(summary, body);

    details.addEventListener("toggle", async () => {
        if(!details.open) return;
        if(details.dataset.loaded === "true") return;

        body.innerHTML = `
        <div class="loader-container">
            <p>Inhalte werden geladen</p>
            <span class="spinner"></span>
        </div>`;
        showLoader(body.querySelector(".spinner"));

        details.dataset.loaded = "loading";
        try {
            await buildUserContent(root, user._id, body);
            details.dataset.loaded = "true";
        } catch (error) {
            console.error("Failed to load user-details:", error);
            body.innerHTML = `<p>Details konnten nicht geladen werden.</p>`
            details.dataset.loaded = "false";
        }
    })

    if(user._id === localStorage.getItem("userId")) {
        summary.style.backgroundColor = "#8c8c8c73";
    }
    return details;
}
