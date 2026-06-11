
import { clearHTML, hideLoader, showInlineNotification, showLoader, showMessage } from "../panel-handling.js";
import { registerUser } from "./api.js";
import { showLogin } from "./views.js";

export async function handleRegistration(event) {
    event.preventDefault();

    const form = event.target.closest("form") ?? document.querySelector("#registrationForm");
    if (!form) return;

    const panel = form.closest("#registration_mask");
    const loader = panel?.querySelector(".spinner");
    const errorBox = form.querySelector("#errorMsgRegister");

    clearHTML(errorBox);

    const data = getRegistrationData(form);
    const validationErrors = validateRegistrationData(data);

    if(validationErrors.length > 0) {
        showInlineNotification(errorBox, validationErrors[0], "error");
        return;
    } 
    showLoader(loader);
    const result = await registerUser({
        firstName: data.firstName, 
        lastName: data.lastName,
        email: data.email,
        password: data.password
    });
    showInlineNotification(
        errorBox,
        result.ok ? result.message : result.errors[0],
        result.ok ? "info" : "error"
    );
    hideLoader(loader);
    if(!result.ok) return;

    form.reset();
    showMessage(document, 
        result.ok ? "Nutzer registriert" : "Nutzer konnte nicht registriert werden", 
        result.ok ? "E-Mail akzeptieren zum Freischalten" : "Bitte die Registrierung erneut versuchen");
    
    showLogin();
}


function getRegistrationData(form) {
    const formData = new FormData(form);
    return {
        firstName: formData.get("firstName")?.trim() ?? "",
        lastName: formData.get("lastName")?.trim() ?? "",
        email: formData.get("email")?.trim() ?? "",
        password: formData.get("password") ?? "",
        confirmPassword: formData.get("confirmPassword") ?? ""
    };
}

export function validateRegistrationData(data) {
    const errors = [];
    if(!data.firstName) errors.push("Vorname muss ausgefüllt sein.");
    if(!data.lastName) errors.push("Nachname muss ausgefüllt sein.");
    if(!data.email) errors.push("E-Mail muss ausgefüllt sein.");
    if(!isValidEmail(data.email)) errors.push("Bitte eine gültige E-Mail eingeben.");
    if(!data.password) errors.push("Passwort muss ausgefüllt werden.");
    if(!data.confirmPassword) errors.push("Bitte Passwort wiederholen.");
    if(data.password !== data.confirmPassword) errors.push("Die Passwörter stimmen nicht überein.");
    return errors;
}

export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}