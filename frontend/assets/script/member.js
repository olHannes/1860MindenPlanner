import * as panel from "./panel-handling.js";
import * as config from "./config.js";

export async function reloadAllUser(root) {
    const loader = root.querySelector("#panel2 .spinner");
    const users = await loadAllUser(loader); 
    renderUsers(root, users);
}


//User Loading
///////////////////////////////////////////////////////////////////
async function loadAllUser(loader) {
    try {
        panel.showLoader(loader);
        const res = await fetch(`${config.serverURL}/users/all`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if(data.ok) return data.users;
        return [];
    } catch (error) {
        console.error("Failed to load User:", error);
        return [];
    } finally {
        panel.hideLoader(loader);
    }
}
function renderUsers(root, users) {
    const memberList = root.getElementById("member-list");
    panel.clearHTML(memberList);
    users.forEach(currentUser => {
        const memberDetails = root.createElement("details");
        memberDetails.classList.add("member-entry");
        memberDetails.dataset.id = currentUser._id;
        //memberDiv.onclick = () => showMemberData(currentUser._id);

        const memberSummary = root.createElement("summary");
        memberSummary.classList.add("member-unit");

        const memberInfos = root.createElement("div");
        memberInfos.classList.add("member-info");

        const memberBody = root.createElement("div");
        memberBody.classList.add("details-body");
        memberBody.innerHTML = `<p>${currentUser.firstName + " " + currentUser.lastName}</p>`;

        const profileImg = root.createElement("img");
        profileImg.src = "frontend/assets/images/system/profile_icon.png";
        profileImg.alt = "Profile Icon";
        profileImg.style.filter = `drop-shadow(0px 0px 5px ${currentUser.color_code})`;

        const nameContainer = root.createElement("div");
        nameContainer.classList.add("name-container");

        const firstNameSpan = root.createElement("span");
        firstNameSpan.className = "nameBig";
        firstNameSpan.textContent = currentUser.firstName;

        const lastNameSpan = root.createElement("span");
        lastNameSpan.className = "nameLight";
        lastNameSpan.textContent = currentUser.lastName;

        const statusIndicator = root.createElement("span");
        statusIndicator.classList.add("member-status");
        statusIndicator.title = currentUser.online ? 'Online' : 'Offline';
        statusIndicator.style.background = currentUser.online ? 'linear-gradient(315deg, #08300c, #28bf40f5)' : 'gray';

        nameContainer.appendChild(firstNameSpan);
        nameContainer.appendChild(lastNameSpan);

        memberInfos.appendChild(profileImg);
        memberInfos.appendChild(nameContainer);

        memberSummary.appendChild(memberInfos);
        memberSummary.appendChild(statusIndicator);

        memberDetails.appendChild(memberSummary);
        memberDetails.appendChild(memberBody);

        if(currentUser._id === localStorage.getItem("userId")) {
            memberSummary.style.backgroundColor = "#8c8c8c73";
        }
        memberList.appendChild(memberDetails);
    });
}

