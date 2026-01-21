import * as userHandling from "./user-handling.js";

export function addFunktionalEventListener(root) {
    //close Information Panel
    const closeInfoBtn = root.querySelector("#closeInfoBox");
    const informationPanel = root.querySelector(".on-top-panel");
    closeInfoBtn?.addEventListener("click", () => {
        if(informationPanel) {
            informationPanel.style.display="none";
            localStorage.setItem("startUpInfo", false);
        }
    });

    //News Panel
    const openNewsBtn = root.querySelector("#showNewsBtn");
    openNewsBtn?.addEventListener("click", () => {
        displayNews(root, true);
        openNewsBtn.style.display="none";
    });
    const closeNewsBtn = root.querySelector("#closeNews");
    closeNewsBtn?.addEventListener("click", () => {
        hideNews(root, true);
        openNewsBtn.style.display="block";
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
    registrationSubmit?.addEventListener("click", () => {
        userHandling.register(root);
    });

    //User Login
    const loginSubmit = root.querySelector("#loginBtn");
    loginSubmit?.addEventListener("click", () => {
        userHandling.login(root);
    });



    const autoLoginCheckbox = document.querySelector("#stayLoggedIn");
    autoLoginCheckbox?.addEventListener("change", (e) => {
        userHandling.setAutoLogin(e.target.checked);
    })
    const settingAutoCheckbox = document.querySelector("#autoLoginCheckbox");
    settingAutoCheckbox?.addEventListener("change", (e) => {
        userHandling.setAutoLogin(e.target.checked);
    });
}




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