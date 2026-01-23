
//exported functions handles visibility changes of floating panels and different views

//basic Functions
//////////////////////////////////////////////////////////////
export function show(el, display = "block") {
    if (el) el.style.display = display;
}
export function hide(el) {
    if (el) el.style.display = "none";
}
export function clearHTML(el) {
    if (el) el.innerHTML = "";
}

// different floating panels
//////////////////////////////////////////////////////////////

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
        hide(startupPanel);
        localStorage.setItem("startUpInfo", false);
    }
}

// news panel
export function showNews(root, push = true) {
    const newsPage = root.getElementById("news");
    const mainPage = root.getElementById("mainPage");
    if(!newsPage || !mainPage) return;
    show(newsPage, "block");
    hide(mainPage);

    if (push) history.pushState({ page: "news" }, "", "#news");
}
export function hideNews(root, push = true) {
    const newsPage = root.getElementById("news");
    const mainPage = root.getElementById("mainPage");
    if(!newsPage || !mainPage) return;
    hide(newsPage);
    show(mainPage, "block");
    if(push) history.back();
}

// download panel
export function displayDownloads(root, push = true) {
    let downloadPanel = root.getElementById("downloadPage");
    let mainPage = root.getElementById("mainPage");

    if(!downloadPanel || !mainPage) return;
    hide(mainPage);
    show(downloadPanel, "block");
    if (push) history.pushState({ page: "download" }, "", "#download");
}
export function hideDownloads(root, push = true) {
    let downloadPanel = root.getElementById("downloadPage");
    let mainPage = root.getElementById("mainPage");

    if(!downloadPanel || !mainPage) return;
    hide(downloadPanel);
    show(mainPage, "block");
    if (push) history.back();
}

//Account deletion Panel
export function showAccountDeletion(root, push = true) {
    const panel = root.getElementById("requestDelAcc");
    const background = root.getElementById("loadingBackground");
    if(!panel || !background) return;
    show(panel, "block");
    show(background, "block");
    if(push) history.pushState({ page: "deleteAccount" }, "", "#deleteAccount");
}
export function hideAccountDeletion(root, push = true) {
    const panel = root.getElementById("requestDelAcc");
    const background = root.getElementById("loadingBackground");
    if(!panel || !background) return;
    hide(panel);
    hide(background);
    if(push) history.back();
}

//Account Adjustments Panel
export function showAdjustProfile(root, push = true) {
    const optionsPanel  = root.getElementById("accountOptionsWrapper");
    const pwdEdit       = root.getElementById("passwordEdit");
    const nameEdit      = root.getElementById("nameEdit");
    if (!optionsPanel || !pwdEdit || !nameEdit) return;
    show(optionsPanel, "block");
    if(push) history.pushState({ page: "profileAdjustment"}, "", "#profileAdjustment");
}
export function hideAdjustProfile(root, push = true) {
    const optionsPanel  = root.getElementById("accountOptionsWrapper");
    const pwdEdit       = root.getElementById("passwordEdit");
    const nameEdit      = root.getElementById("nameEdit");
    if (!optionsPanel || !pwdEdit || !nameEdit) return;
    hide(optionsPanel);
    if(push) history.back();
}


// main Content pages
//////////////////////////////////////////////////////////////
const panelResetters = {
    0: () => {
        hide(document.getElementById("nameEdit"));
        hide(document.getElementById("passwordEdit"));
        hide(document.getElementById("requestDelAcc"));
        show(document.getElementById("nameView"), "block");
    },
    1: () => {
        hide(document.getElementById("elementSelection"));
        hide(document.getElementById("exerciseCreationPanel"));
        hide(document.getElementById("EquipmentExercise"));
        show(document.getElementById("exerciseCreationButtonPanel"), "flex");
    },
    2: () => {
        const list = document.getElementById("memberExerciseList");
        hide(list);
        clearHTML(list);
        const dashboard = document.getElementById("dashboard");
        if (dashboard && dashboard.style.display === "block") {
            //showDashboard();
        }
    },
};
export function resetPanel(panelId) {
    const id = Number(panelId);
    const fn = panelResetters[id];
    if(!fn) {
        console.error("Panel-Reset failed:", panelId);
        return;
    }
    fn();
}
export function toggleMainPanel(root, panelId) {
  const panels = [0,1,2,3].map(i => root.getElementById(`panel${i}`));
  const target = root.getElementById(`panel${panelId}`);
  if (!target) return;

  const wasOpen = target.classList.contains("visible");

  panels.forEach(p => p?.classList.remove("visible"));

  if (!wasOpen) {
    resetPanel(panelId);
    target.classList.add("visible");
  }
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
        if (errorEl) errorEl.classList.toggle("error", false);
        if (errorEl) errorEl.classList.toggle("info", false);
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
    let startMask       = root.getElementById("start-screen");
    let contentPanel    = root.getElementById("content");
    const localUser    = localStorage.getItem("user");
    const localUserId  = localStorage.getItem("userId");

    if(!startMask || !contentPanel) return;

    if(localUser && localUserId) {
        hide(startMask);
        show(contentPanel, "block");
    } else {
        hide(contentPanel);
        show(startMask, "grid");
    }
}