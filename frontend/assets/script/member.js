import * as panel from "./panel-handling.js";
import * as config from "./config.js";

//User Loading
///////////////////////////////////////////////////////////////////
export async function loadAllUser(loader) {
    try {
        panel.showLoader(loader);
        const res = await fetch(`${config.serverURL}/users/visible/all`, {
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
export function renderUsers(root, users) {
    const memberList = root.getElementById("member-list");
    panel.clearHTML(memberList);
    users.forEach(currentUser => {
        const memberDetails = root.createElement("details");
        memberDetails.classList.add("member-unit");
        memberDetails.dataset.id = currentUser._id;
        //memberDiv.onclick = () => showMemberData(currentUser._id);

        const memberSummary = root.createElement("summary");
        
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
        firstNameSpan.className = "name-de";
        firstNameSpan.textContent = currentUser.firstName;

        const lastNameSpan = root.createElement("span");
        lastNameSpan.className = "name-en";
        lastNameSpan.textContent = currentUser.lastName;

        const statusIndicator = root.createElement("span");
        statusIndicator.classList.add("status-indicator");
        statusIndicator.title = currentUser.online ? 'Online' : 'Offline';
        statusIndicator.style.backgroundColor = currentUser.online ? 'green' : 'gray';

        nameContainer.appendChild(firstNameSpan);
        nameContainer.appendChild(lastNameSpan);

        memberSummary.appendChild(profileImg);
        memberSummary.appendChild(nameContainer);
        memberSummary.appendChild(statusIndicator);

        memberDetails.appendChild(memberSummary);
        memberDetails.appendChild(memberBody);

        if(currentUser._id === localStorage.getItem("userId")) {
            memberSummary.style.backgroundColor = "#8c8c8c73";
        }
        memberList.appendChild(memberDetails);
    });
}

