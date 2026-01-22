//exported functions handles visibility changes of floating panels and different views

// start-up Information 
export function showStartupInformation(root) {
    const startupPanel = root.getElementById("startupInformation");
    if(startupPanel) {
        startupPanel.style.display = localStorage.getItem("startUpInfo") ? "none" : "flex";
    }
}
export function hideStartupInformation(root) {
    const startupPanel = root.querySelector(".on-top-panel");
    if(startupPanel) {
        startupPanel.style.display = "none";
        localStorage.setItem("startUpInfo", false);
    }
}

// news panel
export function displayNews(root, push = true) {
    const newsPage = root.getElementById("news");
    const mainPage = root.getElementById("mainPage");
    if(!newsPage || !mainPage) return;
    newsPage.style.display = "block";
    mainPage.style.display = "none";

    if (push) history.pushState({ page: "news" }, "", "#news");
}
export function hideNews(root, push = true) {
    const newsPage = root.getElementById("news");
    const mainPage = root.getElementById("mainPage");
    if(!newsPage || !mainPage) return;
    newsPage.style.display = "none";
    mainPage.style.display = "block";
    if(push) history.back();
}

// download panel
export function displayDownloads(root, push = true) {
    let downloadPanel = root.getElementById("downloadPage");
    let mainPage = root.getElementById("mainPage");

    if(!downloadPanel || !mainPage) return;
    downloadPanel.style.display = "block";
    mainPage.style.display = "none";
    if (push) history.pushState({ page: "download" }, "", "#download");

}
export function hideDownloads(root, push = true) {
    let downloadPanel = root.getElementById("downloadPage");
    let mainPage = root.getElementById("mainPage");

    if(!downloadPanel || !mainPage) return;
    downloadPanel.style.display = "none";
    mainPage.style.display = "block";
    history.back();
}


// User Login and Registration
//////////////////////////////////////////////////////////////
export function clearForm(root, inputIds = [], errorId = null) {
    if (!root) return;
    inputIds.forEach(id => {
        const el = root.getElementById(id);
        if (el && "value" in el) {
            el.value = "";
        }
    });
    if (errorId) {
        const errorEl = root.getElementById(errorId);
        if (errorEl) errorEl.textContent = "";
    }
}

// Registration
export function showRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    if(!loginMask || !registrationMask) return;
    clearForm(root, ["firstName", "lastName", "newPassword", "confirmPassword"], "errorMsgRegister");
    loginMask.style.display = "none";
    registrationMask.style.display = "block";
}
export function hideRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    if(!loginMask || !registrationMask) return;
    clearForm(root, ["username", "password"], "errorMsg");
    registrationMask.style.display = "none";
    loginMask.style.display = "block";
}


export function applyLoginStatus(root) {
    let loginMask       = root.getElementById("login_mask");
    let headline        = root.getElementById("headline");
    let contentPanel    = root.getElementById("content");
    const localUser    = localStorage.getItem("user");
    const localUserId  = localStorage.getItem("userId");

    if(!loginMask || !headline || !contentPanel) return;

    if(localUser && localUserId) {
        loginMask.style.display = "none";
        headline.style.display = "none";
        contentPanel.style.display = "block";
    } else {
        loginMask.style.display = "block";
        headline.style.display = "block";
        contentPanel.style.display = "none";
    }
}