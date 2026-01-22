import * as userHandling from "./user-handling.js";
import * as panel from "./panel-handling.js";

export function addFunktionalEventListener(root) {
    //close Information Panel
    const closeInfoBtn = root.querySelector("#closeInfoBox");
    closeInfoBtn?.addEventListener("click", () => {
        panel.hideStartupInformation(root);
    });

    //News Panel
    const openNewsBtn_1 = root.querySelector("#showNewsBtn");
    openNewsBtn_1?.addEventListener("click", () => {
        panel.displayNews(root, true);
        openNewsBtn_1.style.display="none";
    });
    const openNewsBtn_2 = root.querySelector(".openNewsBtn");
    openNewsBtn_2?.addEventListener("click", () => {
        panel.displayNews(root, true);
    });
    const closeNewsBtn = root.querySelector("#closeNews");
    closeNewsBtn?.addEventListener("click", () => {
        panel.hideNews(root, true);
        openNewsBtn_1.style.display="block";
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
    const autoLoginCheckbox = document.querySelector("#stayLoggedIn");
    autoLoginCheckbox?.addEventListener("change", (e) => {
        userHandling.setAutoLogin(e.target.checked);
    })
    const settingAutoCheckbox = document.querySelector("#autoLoginCheckbox");
    settingAutoCheckbox?.addEventListener("change", (e) => {
        userHandling.setAutoLogin(e.target.checked);
    });
}
