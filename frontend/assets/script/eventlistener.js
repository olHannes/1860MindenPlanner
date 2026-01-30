import * as userHandling from "./user-handling.js";
import * as settings from "./settings.js";
import * as panel from "./panel-handling.js";

export function addFunktionalEventListener(root) {
    userControlListener(root);
    addFloatingPanelListener(root);
    addMainPanelListener(root);
    setAccountSettingsListener(root);
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
        panel.showDownloads(root, true);
    });
    const closeDownloadBtn = root.querySelector("#closeDownloadBtn");
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
    submitReport?.addEventListener("click", async () => {
        if(submitReport.disabled == true) return;
        submitReport.disabled = true;
        submitReport.style.opacity = "0.5";
        await settings.submitReport(root);
        submitReport.disabled = false;
        submitReport.style.opacity = "1";
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
        panel.toggleMainPanel(root, 3);
    });
    /*
    const adjustProfileBtn = root.querySelector("#userOptions");
    adjustProfileBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 3);
    });
    const hideAdjustProfileBtn = root.querySelector("#hideAdjustProfile");
    hideAdjustProfileBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 3);
    });
    */
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
    registrationSubmit?.addEventListener("click", async () => {
        if(registrationSubmit.disabled == true) return;
        registrationSubmit.disabled = true;
        registrationSubmit.style.opacity = "0.5";
        await userHandling.register(root);
        registrationSubmit.disabled = false;
        registrationSubmit.style.opacity = "1";
    });
    //User Login Submit
    const loginSubmit = root.querySelector("#loginBtn");
    loginSubmit?.addEventListener("click", async () => {
        if(loginSubmit.disabled == true) return;
        loginSubmit.disabled = true;
        loginSubmit.style.opacity = "0.5";
        await userHandling.login(root);
        loginSubmit.disabled = false;
        loginSubmit.style.opacity = "1";
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
    deleteAccount?.addEventListener("click", async () => {
        if(deleteAccount.disabled == true) return;
        deleteAccount.disabled = true;
        deleteAccount.style.opacity = "0.5";
        const rc = await userHandling.deleteUserAccount(root);
        deleteAccount.disabled = false;
        deleteAccount.style.opacity = "1";
        
        const errMsg = root.querySelector("#deleteErr");
        if(!errMsg) return;

        errMsg.innerText = rc.message ?? "Account konnte nicht gelöscht werden";
        errMsg.classList.toggle("info", rc.returnCode == 0);
        errMsg.classList.toggle("error", rc.returnCode != 0);
    });
    //User Logout
    const logoutBtn = root.querySelector("#logoutBtn");
    logoutBtn?.addEventListener("click", async () => {
        if(logoutBtn.disabled == true) return;
        logoutBtn.disabled = true;
        logoutBtn.style.opacity = "0.5";
        await userHandling.logout(root);
        logoutBtn.disabled = false;
        logoutBtn.style.opacity = "1";
    });
}

//Account Settings
function setAccountSettingsListener(root) {
    //Profile Color
    const colorChangeBtn = root.querySelector("#colorContainer");
    colorChangeBtn?.addEventListener("click", (e) => {
        const colorEl = e.target.closest(".colorPick");
        if(!colorEl) return;
        const color = colorEl.dataset.color;
        if (!color) return;
        settings.changeProfileColor(root, color);
    });

    //Profile visibility
    const visibilityToggle = root.querySelector("#visibleCheckbox");
    visibilityToggle?.addEventListener("change", (e) => {
        settings.changeProfileVisibility(root, e.target.checked);
    });

    //Name Change
    const nameChangeBtn = root.querySelector("#editNameBtn");
    nameChangeBtn?.addEventListener("click", () => {
        panel.showAdjustName(root, true);
    });
    const nameChangeCancelBtn = root.querySelector("#cancelNameBtn");
    nameChangeCancelBtn?.addEventListener("click", () => {
        panel.hideAdjustName(root, true);
    });
    const nameSubmitBtn = root.querySelector("#saveNameBtn");
    nameSubmitBtn?.addEventListener("click", () => {
        userHandling.submitNameChange(root);
    });

    //Show Panel to change Password
    const passwordChangeBtn = root.querySelector("#editPasswordBtn");
    passwordChangeBtn?.addEventListener("click", () => {
        panel.showAdjustPassword(root, true);
    });
    const pwdChangeBtn_2 = root.querySelector("#forgotPwd");
    pwdChangeBtn_2?.addEventListener("click", () => {
        panel.clearValue(root.querySelector("#pwdForgot_email"));
        panel.clearHTML(root.querySelector("#pwdForgotErr"));
        panel.showPasswordForgot(root, true);
    });

    //Hide Panel to change Password
    const passwordChangeCancelBtn = root.querySelector("#cancelPwResetBtn");
    passwordChangeCancelBtn?.addEventListener("click", () => {
        panel.hideAdjustPassword(root, true);
    });
    const cancelPwdForgot = root.querySelector("#cancelPwdForgot");
    cancelPwdForgot?.addEventListener("click", () => {
        panel.hidePasswordForgot(root);
    });
    const cancelPwdForgot2 = root.querySelector("#cancelPwdForgot2");
    cancelPwdForgot2?.addEventListener("click", () => {
        panel.hide(root.querySelector("#pwdForgot-page-2"));
        panel.show(root.querySelector("#pwdForgot-page-1", "block"));
        panel.hidePasswordForgot(root);
    });

    //Send Reset Email
    const sendCodeBtn = root.querySelector("#sendResetCodeBtn");
    sendCodeBtn?.addEventListener("click", async () => {
        if(sendCodeBtn.disabled == true) return;
        sendCodeBtn.disabled = true;
        sendCodeBtn.style.opacity = "0.5";
        em = localStorage.getItem("userEmail");
        rc = await userHandling.sendResetCode(em);
        setTimeout(() => {
            sendCodeBtn.disabled = false;
            sendCodeBtn.style.opacity = "1";
        }, 5000);
        //set return message
    });
    const sendResetCode = root.querySelector("#sendEmailForgot");
    sendResetCode?.addEventListener("click", async () => {
        if(sendResetCode.disabled == true) return;
        sendResetCode.disabled = true;
        sendResetCode.style.opacity = "0.5";
        const loader = root.querySelector("#pwdForgot_mask .spinner");
        let em = root.querySelector("#pwdForgot_email")?.value;
        panel.showLoader(loader);
        let rc = await userHandling.sendResetCode(em);
        panel.hideLoader(loader);
        setTimeout(() => {
            sendResetCode.disabled = false;
            sendResetCode.style.opacity = "1";
        }, 5000);
        const errMsg = root.querySelector("#pwdForgotErr");
        const panel1 = root.querySelector("#pwdForgot-page-1");
        const panel2 = root.querySelector("#pwdForgot-page-2");
        if(!errMsg || !panel1 || !panel2) return;
        errMsg.innerText = rc.message ?? "E-Mail konnte nicht gesendet werden";
        errMsg.classList.toggle("info", rc.returnCode == 0);
        errMsg.classList.toggle("error", rc.returnCode != 0);
        if(rc.returnCode == 0) {
            panel.hide(panel1);
            panel.show(panel2, "block");
            localStorage.setItem("userEmail", em);
        } else {
            panel.hide(panel2);
            panel.show(panel, "block");
        }
    });

    //Send Verified Code and submit new Passwort
    const passwordSubmitBtn = root.querySelector("#confirmPwResetBtn");
    passwordSubmitBtn?.addEventListener("click", async () => {
        if(passwordSubmitBtn.disabled == true) return;
        passwordSubmitBtn.disabled = true;
        passwordSubmitBtn.style.opacity = "0.5";
        rc = await userHandling.submitPasswordChange(root);
        setTimeout(() => {
            passwordSubmitBtn.disabled = false;
            passwordSubmitBtn.style.opacity = "1";
        }, 5000);
    });
    const submitPwdRequest = root.querySelector("#requestNewPwd");
    submitPwdRequest?.addEventListener("click", async () => {
        if(submitPwdRequest.disabled == true) return;
        submitPwdRequest.disabled = true;
        submitPwdRequest.style.opacity = "0.5";
        const loader = root.querySelector("#pwdForgot_mask .spinner");
        const errMsg = root.querySelector("#pwdForgotErr");
        const panel1 = root.querySelector("#pwdForgot-page-1");
        const panel2 = root.querySelector("#pwdForgot-page-2");
        panel.showLoader(loader);
        let rc = await userHandling.requestPasswordChange(root);
        panel.hideLoader(loader);
        setTimeout(() => {
            submitPwdRequest.disabled = false;
            submitPwdRequest.style.opacity = "1";
        }, 5000);
        if(!errMsg || !panel1 || !panel2) return;
        errMsg.innerText = rc.message ?? "Passwort konnte nicht geändert werden";
        errMsg.classList.toggle("info", rc.returnCode == 0);
        errMsg.classList.toggle("error", rc.returnCode != 0);
        if(rc.returnCode == 0) {
            panel.hide(panel1);
            panel.show(panel2, "block");
            panel.hidePasswordForgot(root);
            panel.showMessage(root, "Passwort geändert", "Dein Passwort wurde erfolgreich geändert.");
            panel.clearForm(root, ["login-email", "password"], "errorMsg");
        }
    });
}