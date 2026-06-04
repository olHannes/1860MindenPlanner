
import * as panel from "../../panel-handling.js";
import { requestVisibilityChange, requestNameChange } from "../api.js";


export function bindNameSettingsEvents(root) {
    const container = root.querySelector("#nameSettings");
    const form = root.querySelector("#nameForm");

    form?.addEventListener("submit", (e) => {
        e.preventDefault();
        updateName(root);
    });
    
    container?.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;

        if(action === "cancel-name-view") {
            hideNameView(root);
        }
    });
}


export function showNameView(root) {
    if(!root) return;
    const container = root.querySelector("#nameSettings");
    const msg       = root.querySelector("#nameMsg");
    panel.clearValue(root.querySelector("#firstNameEdit"));
    panel.clearValue(root.querySelector("#lastNameEdit"));
    panel.clearHTML(msg);
    msg.classList.toggle("info", false);
    msg.classList.toggle("error", false);
    panel.showFloatingBackground(root);
    panel.show(container, "block");
}


export function hideNameView(root) {
    panel.hide(root.querySelector("#nameSettings"));
    panel.hideFloatingBackground(root);
}


export async function toggleVisibility(root, visibility) {
    if(!root) return;
    let visible = visibility ? 1 : 0;

    const loader = root.querySelector(".userName .spinner");
    panel.showLoader(loader);
    const result = await requestVisibilityChange({ visible: visible });
    panel.hideLoader(loader);

    panel.showMessage(root, result.ok ? "Sichtbarkeit wurde geändert" : "Sichtbarkeit konnte nicht gespeichert werden", result.message);
}


export async function updateName(root) {
    const loader = root.querySelector("#nameSettings .spinner");
    const firstNameEl = root.querySelector("#firstNameEdit");
    const lastNameEl = root.querySelector("#lastNameEdit");
    
    panel.showLoader(loader);

    let firstName = firstNameEl && firstNameEl?.value.length > 0
        ? firstNameEl.value
        : firstNameEl?.placeholder;
    let lastName = lastNameEl && lastNameEl?.value.length > 0
        ? lastNameEl.value
        : lastNameEl?.placeholder;

    const result = await requestNameChange({ firstName: firstName, lastName: lastName });

    const errMsg = root.querySelector("#nameMsg");
    errMsg.innerText = result.message;
    errMsg.classList.toggle("info", result.ok == true);
    errMsg.classList.toggle("error", result.ok == false);

    panel.showMessage(root, result.ok ? "Name erfolgreich geändert" : "Name konnte nicht geändert werden", result.message);
    panel.hideLoader(loader);
}