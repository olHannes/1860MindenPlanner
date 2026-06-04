import { clearHTML, hideLoader, showLoader, showMessage } from "../../panel-handling.js";
import { requestProfileColorChange } from "../api.js";


export function renderColorPicker(root, colors) {
    const colorPickerContainer = root.querySelector("#colorContainer");
    clearHTML(colorPickerContainer);

    colors.forEach(color => {
        const btn = root.createElement("button");

        btn.type = "button";
        btn.dataset.color = color.color;
        btn.dataset.action = "change-color";
        btn.className = "colorPick";
        btn.setAttribute("aria-label", `Akzentfarbe ${color}`);
        btn.style.background = color.color;

        colorPickerContainer.appendChild(btn);
    });
}

export async function changeProfileColor(root, color) {
    const loader = root.querySelector("#panel3 .spinner");
    const profileImg = root.querySelector("#profilePicture");

    showLoader(loader);
    const result = await requestProfileColorChange({color: color});
    showMessage(root, result.ok ? "Die Profilfarbe wurde geändert" : "Die Profilfarbe konnte nicht geändert werden", result.message);

    profileImg.style.filter = result.ok 
        ? `drop-shadow(0px 0px 5px ${color})`
        : "";
    hideLoader(loader);
}