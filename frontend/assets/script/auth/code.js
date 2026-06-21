
import {showLogin, showRegistration, showPasswordForgot} from "./views.js";
import {handleRegistration} from "./registration.js";
import { handleAutoLogin, handleLogin } from "./login.js";
import { handlePasswordForgotRequest } from "./passwordForgot.js";

const actions = {
    "login": handleLogin,
    "registration": showRegistration,
    "cancel-registration": showLogin,
    "submit-registration": handleRegistration,
    "pwd-forget": showPasswordForgot,
    "cancel-pwd-forget": showLogin,

    "send-code-via-mail": handlePasswordForgotRequest,
    //"request-new-pwd": handlePasswordReset,

    "cancel-pwd-reset": showLogin,
};

document.body.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if(!target) return;
    event.preventDefault();

    const action = target.dataset.action;
    console.log("action: ", action);
    const handler = actions[action];

    if(!handler) {
        console.warn("Invalid Action: ", action);
        return;
    }
    await handler(event, target);
});


handleAutoLogin();