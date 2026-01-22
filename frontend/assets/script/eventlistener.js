import * as userHandling from "./user-handling.js";
import * as panel from "./panel-handling.js";

export function addFunktionalEventListener(root) {
    //close Information Panel
    const closeInfoBtn = root.querySelector("#closeInfoBox");
    closeInfoBtn?.addEventListener("click", () => {
        panel.hideStartupInformation(root);
    });

    //News Panel
    const openNewsBtn = root.querySelector("#showNewsBtn");
    openNewsBtn?.addEventListener("click", () => {
        panel.displayNews(root, true);
        openNewsBtn.style.display="none";
    });
    const closeNewsBtn = root.querySelector("#closeNews");
    closeNewsBtn?.addEventListener("click", () => {
        panel.hideNews(root, true);
        openNewsBtn.style.display="block";
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
