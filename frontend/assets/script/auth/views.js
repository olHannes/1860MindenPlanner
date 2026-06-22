import { clearHTML } from "../panel-handling.js";

const views = {
    login: document.querySelector("#login_mask"),
    registration: document.querySelector("#registration_mask"),
    passwordForgot: document.querySelector("#pwdForgot_mask"),
    confirmation: document.querySelector("#confirm_mask"),
};

function showOnly(viewName) {
    Object.entries(views).forEach(([name, element]) => {
        if(!element) return;
        element.hidden = name !== viewName;
    });
}

export function showLogin() {
    const errMsg = document.getElementById("errorMsg");
    const forgotPage1 = document.getElementById("pwdForgot-page-1");
    const forgotPage2 = document.getElementById("pwdForgot-page-2");
    errMsg.classList = [];
    clearHTML(errMsg);
    forgotPage1.hidden = false;
    forgotPage2.hidden = true;
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

export function showConfirm() {
    showOnly("confirmation");
}

export function hideConfirm() {
    showLogin();
}