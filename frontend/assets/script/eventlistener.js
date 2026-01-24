import * as userHandling from "./user-handling.js";
import * as settings from "./settings.js";
import * as panel from "./panel-handling.js";

export function addFunktionalEventListener(root) {
    userControlListener(root);
    addFloatingPanelListener(root);
    addMainPanelListener(root);
}


function addFloatingPanelListener(root) {
    //close Information Panel
    const closeInfoBtn = root.querySelector("#closeInfoBox");
    closeInfoBtn?.addEventListener("click", () => {
        panel.hideStartupInformation(root);
    });

    //News Panel
    const openNewsBtn_1 = root.querySelector("#showNewsBtn");
    openNewsBtn_1?.addEventListener("click", () => {
        panel.showNews(root, true);
        openNewsBtn_1.style.display="none";
    });
    const openNewsBtn_2 = root.querySelector(".openNewsBtn");
    openNewsBtn_2?.addEventListener("click", () => {
        panel.showNews(root, true);
    });
    const closeNewsBtn = root.querySelector("#closeNews");
    closeNewsBtn?.addEventListener("click", () => {
        panel.hideNews(root, true);
        openNewsBtn_1.style.display="flex";
    });

    //download panel
    const openDownloadsBtn = root.querySelector(".openDownloadsBtn");
    openDownloadsBtn?.addEventListener("click", () => {
        panel.displayDownloads(root, true);
    });
    const closeDownloadBtn = root.querySelector(".closeDownloadBtn");
    closeDownloadBtn?.addEventListener("click", () => {
        panel.hideDownloads(root, true);
    });

    const openReportBtn = root.querySelector("#reportIssue");
    openReportBtn?.addEventListener("click", () => {
        panel.showReportCreation(root, true);
    });
    const closeReportBtn = root.querySelector("#cancelReport");
    closeReportBtn?.addEventListener("click", () => {
        panel.hideReportCreation(root, true);
    });
    const submitReport = root.querySelector("#submitReport");
    submitReport?.addEventListener("click", () => {
        settings.submitReport(root);
    });
    const reportTypeSel = root.querySelector("#reportType");
    reportTypeSel?.addEventListener("change", () => {
        const headline = root.querySelector("#createReport h2");
        const selectedVal = reportTypeSel.value;
        if(!headline ||!selectedVal) return;
        headline.textContent = selectedVal + " melden";
    });

    //request Account deletion
    const deleteBtn = root.querySelector("#delBtn");
    deleteBtn?.addEventListener("click", () => {
        panel.showAccountDeletion(root, true);
    });
    //cancel Account deletion
    const cancelDeletionBtn = root.querySelector("#cancelDeletion");
    cancelDeletionBtn?.addEventListener("click", () => {
        panel.hideAccountDeletion(root, true);
    });
    const hideAdjustProfileBtn = root.querySelector("#hideAdjustProfile");
    hideAdjustProfileBtn?.addEventListener("click", () => {
        panel.hideAdjustProfile(root, true);
    });

}


function addMainPanelListener(root) {
    const toggleEquipmentBtn = root.querySelector("#toggleEquipment");
    toggleEquipmentBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 1);
    });
    const toggleGroupsBtn = root.querySelector("#toggleGroups");
    toggleGroupsBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 2);
    });
    const toggleSettingsBtn = root.querySelector("#toggleSettings");
    toggleSettingsBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 0);
    });
    const adjustProfileBtn = root.querySelector("#userOptions");
    adjustProfileBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 3);
    });
    const hideAdjustProfileBtn = root.querySelector("#hideAdjustProfile");
    hideAdjustProfileBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 3);
    });
}

function userControlListener(root) {
    //open Registration Panel
    const registrationBtn = root.querySelector("#registerBtn");
    registrationBtn?.addEventListener("click", () => {
        panel.showRegistration(root);
    });
    //close Registration Panel
    const closeRegistrationBtn = root.querySelector("#cancelBtn");
    closeRegistrationBtn?.addEventListener("click", () => {
        panel.hideRegistration(root);
    });
    //User Registration Submit
    const registrationSubmit = root.querySelector("#registerSubmitBtn");
    registrationSubmit?.addEventListener("click", () => {
        userHandling.register(root);
    });
    //User Login Submit
    const loginSubmit = root.querySelector("#loginBtn");
    loginSubmit?.addEventListener("click", () => {
        userHandling.login(root);
    });
    //Auto Login Change -> Login Page
    const autoLoginCheckbox = root.querySelector("#stayLoggedIn");
    autoLoginCheckbox?.addEventListener("change", (e) => {
        userHandling.setAutoLogin(e.target.checked);
    })
    //Auto Login Change -> Settings Page
    const settingAutoCheckbox = root.querySelector("#autoLoginCheckbox");
    settingAutoCheckbox?.addEventListener("change", (e) => {
        userHandling.setAutoLogin(e.target.checked);
    });
    //User Deletion
    const deleteAccount = root.querySelector("#deleteAccount");
    deleteAccount?.addEventListener("click", () => {
        userHandling.deleteUserAccount(root);
    });
    //User Logout
    const logoutBtn = root.querySelector("#logoutBtn");
    logoutBtn?.addEventListener("click", () => {
        userHandling.logout(root);
    });
}