import { clearHTML } from "../panel-handling.js";

const views = {
    login: document.querySelector("#login_mask"),
    registration: document.querySelector("#registration_mask"),
    passwordForgot: document.querySelector("#pwdForgot_mask"),
};

function showOnly(viewName) {
    Object.entries(views).forEach(([name, element]) => {
        if(!element) return;
        element.hidden = name !== viewName;
    });
}

export function showLogin() {
    const errMsg = document.getElementById("errorMsg");
    errMsg.classList = [];
    clearHTML(errMsg);
    showOnly("login");
}

export function showRegistration() {
    const errMsg = document.getElementById("errorMsgRegister");
    errMsg.classList = [];
    clearHTML(errMsg);
    showOnly("registration");
}

export function showPasswordForgot() {
    const errMsg = document.getElementById("pwdForgotErr");
    errMsg.classList = [];
    clearHTML(errMsg);
    showOnly("passwordForgot");
}