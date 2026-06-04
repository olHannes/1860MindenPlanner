import * as userHandling from "./user-handling.js";
import * as exercise from "./exercise.js";
import * as panel from "./panel-handling.js";

import { showView } from "./exercise/views/navigation.js";
import { VIEWS } from "./exercise/constants.js";
import { hideAccountDeletionView } from "./settings/views/view-account-deletion-settings.js";
import { startFeature } from "./competition/index.js";
import { startMemberFeature } from "./member/index.js";


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

}


function addMainPanelListener(root) {
    const toggleEquipmentBtn = root.querySelector("#toggleEquipment");
    toggleEquipmentBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 1);
        showView(root, VIEWS.APPARATUS_LIST);
        
    });
    const toggleGroupsBtn = root.querySelector("#toggleMember");
    toggleGroupsBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 2);
        startMemberFeature(root);
    });
    const toggleCompetitionBtn = root.querySelector("#toggleCompetition");
    toggleCompetitionBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 3);
        startFeature(root);
    });
    const toggleSettingsBtn = root.querySelector("#toggleSettings");
    toggleSettingsBtn?.addEventListener("click", () => {
        panel.toggleMainPanel(root, 4);
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
        userHandling.setAutoLogin(root, e.target.checked);
    })
}

//Account Settings
function setAccountSettingsListener(root) {

    //Show Panel to change Password
    const pwdChangeBtn_2 = root.querySelector("#forgotPwd");
    pwdChangeBtn_2?.addEventListener("click", () => {
        panel.clearValue(root.querySelector("#pwdForgot_email"));
        panel.clearHTML(root.querySelector("#pwdForgotErr"));
        panel.showPasswordForgot(root, true);
    });

    //Hide Panel to change Password
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


    const sendResetCode = root.querySelector("#sendEmailForgot");
    sendResetCode?.addEventListener("click", async () => {
        if(sendResetCode.disabled == true) return;
        sendResetCode.disabled = true;
        sendResetCode.style.opacity = "0.5";
        const loader = root.querySelector("#pwdForgot_mask .spinner");
        let em = root.querySelector("#pwdForgot_email")?.value;
        let rc = await userHandling.sendResetCode(em, loader);
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
}