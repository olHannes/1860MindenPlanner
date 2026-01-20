import * as userHandling from "./userHandling.js";

export function addFunktionalEventListener(root) {
    //close Information Panel
    const closeInfoBtn = root.querySelector("#closeInfoBox");
    const informationPanel = root.querySelector(".on-top-panel");
    closeInfoBtn?.addEventListener("click", () => {
        if(informationPanel) {
            informationPanel.style.display="none";
            localStorage.setItem("startUpInfo", true);
        }
    });

    //close News Panel
    const closeNewsBtn = root.querySelector("#closeNews");
    closeNewsBtn?.addEventListener("click", () => {
        closeNews();
    });

    //open Registration Panel
    const registrationBtn = root.querySelector("#registerBtn");
    registrationBtn?.addEventListener("click", () => {
        userHandling.showRegistration(root);
    });
    //close Registration Panel
    const closeRegistrationBtn = root.querySelector("#cancelBtn");
    closeRegistrationBtn?.addEventListener("click", () => {
        userHandling.hideRegistration(root);
    });
    //User Registration
    const registrationSubmit = root.querySelector("#registerSubmitBtn");
    const registrationMask = root.querySelector("#registration_mask");
    registrationSubmit?.addEventListener("click", () => {
        if(!registrationMask) return;
        userHandling.register(registrationMask);
    });

    //User Login
    const loginSubmit = root.querySelector("#loginBtn");
    const loginMask = root.querySelector("#login_mask");
    loginSubmit?.addEventListener("click", () => {
        if(!loginMask) return;
        userHandling.login(loginMask);
    });
}





export function closeNews(root, push = true) {
    const newsPage = root.getElementById("news");
    const mainPage = root.getElementById("mainPage");
    if(!newsPage || !mainPage) return;
    newsPage.style.display = "none";
    mainPage.style.display = "block";
    if(push) history.back();
}