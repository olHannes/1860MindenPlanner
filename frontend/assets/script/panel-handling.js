
//exported functions handles visibility changes of floating panels and different views
import * as settings from "./settings.js";

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
export function clearValue(el) {
    if (el) el.value = "";
}


//show global Message
//////////////////////////////////////////////////////////////
export function showMessage(root, title, content) {
    let container = root.getElementById("MessageBox");
    let titleEl   = root.getElementById("messageBoxTitle");
    let contentEl = root.getElementById("messageBoxContent");
    if(!container || !titleEl || !contentEl) return;

    titleEl.textContent = title;
    contentEl.textContent = content;
    container.classList.add("show");

    const hideMsg = () => {
        container.classList.remove("show");
        container.removeEventListener("click", hideMsg);
    }
    container.addEventListener("click", hideMsg)
    setTimeout(() => {
        hideMsg();
    }, 2000);
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
    const panel         = root.getElementById("requestDelAcc");
    const background    = root.getElementById("loadingBackground");
    const pwdInput      = root.getElementById("deleteAccountPwd");
    clearValue(pwdInput);
    show(panel, "block");
    show(background, "block");
    if(push) history.pushState({ page: "deleteAccount" }, "", "#deleteAccount");
}
export function hideAccountDeletion(root, push = true) {
    const panel = root.getElementById("requestDelAcc");
    const background = root.getElementById("loadingBackground");
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

//Account Name Change Panel
export function showAdjustName(root, push = true) {
    const wrapperPanel = root.querySelector(".userSettingsWrapper");
    const panel = root.getElementById("nameSettings");
    const firstName = root.getElementById("firstNameEdit");
    const lastName = root.getElementById("lastNameEdit");
    if(!firstName || !lastName) return;
    firstName.value = "";
    lastName.value = "";
    show(wrapperPanel, "flex");
    show(panel, "block");
    if(push) history.pushState({ page: "nameChange"}, "", "#nameChange");
}
export function hideAdjustName(root, push = true) {
    const panel = root.getElementById("nameSettings");
    const wrapperPanel = root.querySelector(".userSettingsWrapper");
    hide(panel);
    hide(wrapperPanel);
    if(push) history.back();
}

//Account Passwort Reset Panel
export function showAdjustPassword(root, push = true) {
    const wrapperPanel = root.querySelector(".userSettingsWrapper");
    const panel = root.getElementById("passwordReset");
    const emailCode = root.getElementById("pwCode");
    const codeNew = root.getElementById("pwNew");
    if(!emailCode || !codeNew) return;
    emailCode.value = "";
    codeNew.value = "";
    show(wrapperPanel, "flex");
    show(panel, "block");
    if(push) history.pushState({ page: "passwordChange"}, "", "#passwordChange");
}
export function hideAdjustPassword(root, push = true) {
    const wrapperPanel = root.querySelector(".userSettingsWrapper");
    const panel = root.getElementById("passwordReset");
    hide(panel);
    hide(wrapperPanel);
    if(push) history.back();
}

//Report Panel
export function showReportCreation(root, push = true) {
    const panel = root.getElementById("createReport");
    const list = root.getElementById("reportList");
    if(!panel || !list) return;
    clearValue(document.getElementById("reportTitle"));
    clearValue(document.getElementById("reportTxt"));
    
    clearHTML(list);
    list.innerHTML = `<div class="loader" id="reportLoader"></div>`;

    settings.loadExistingReports(root);
    show(panel, "block");
    if(push) history.pushState({ page: "reportCreation"}, "", "#reportCreation");
}
export function hideReportCreation(root, push = true) {
    const panel = root.getElementById("createReport");
    if(!panel) return;
    hide(panel);
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
        console.warn("Panel-Reset failed:", panelId);
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
    clearForm(root, ["firstName", "lastName", "newPassword", "confirmPassword"], "errorMsgRegister");
    hide(loginMask);
    show(registrationMask, "block");
}
export function hideRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    clearForm(root, ["email", "password"], null);
    hide(registrationMask);
    show(loginMask, "block");
}

export function showPasswordForgot(root) {
    const loginMask = root.getElementById("login_mask");
    const pwdMask   = root.getElementById("pwdForgot_mask");
    hide(loginMask);
    show(pwdMask, "block");
}
export function hidePasswordForgot(root) {
    const loginMask = root.getElementById("login_mask");
    const pwdMask   = root.getElementById("pwdForgot_mask");
    hide(pwdMask);
    show(loginMask, "block");
}

export function applyLoginStatus(root) {
    let startMask       = root.getElementById("start-screen");
    let contentPanel    = root.getElementById("content");
    const localUserId  = localStorage.getItem("userId");
    if(!startMask || !contentPanel) return;

    if(localUserId) {
        hide(startMask);
        show(contentPanel, "block");
    } else {
        hide(contentPanel);
        show(startMask, "grid");
    }
}