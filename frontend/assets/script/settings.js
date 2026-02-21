import * as panel from "./panel-handling.js";
import * as user from "./user-handling.js";
import * as config from "./config.js";

export async function submitReport(root) {
    const selectedValue = root.getElementById("reportType")?.value;
    const reportTitle   = root.getElementById("reportTitle")?.value?.trim();
    const reportTxt     = root.getElementById("reportTxt")?.value?.trim();
    const userId        = localStorage.getItem("userId");

    if(!userId) {
        console.warn("User-Id nicht gefunden");
        panel.hideReportCreation(root, true);
        return;
    }
    if(!selectedValue || !reportTitle || !reportTxt) {
        panel.showMessage(root, "Fehlende Eingaben", "Ein Report muss mindestens einen Typen und eine Beschreibung haben!");
        panel.hideReportCreation(root, true);
        return;
    }
    try {
        //showLoader();
        const resp = await fetch(`${config.serverURL}/report/issue`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ 
                userId: userId, 
                reportType: selectedValue, 
                reportTitle: reportTitle, 
                report: reportTxt 
            })
        });
        const data = await resp.json();
        console.log(data);
        if(!resp.ok) throw new Error(data.message ?? "Network error");
        if(!data.ok) {
            panel.showMessage(root, "Report-Erstellung ist fehlgeschlagen", data.message ?? "Der Report konnte nicht angelegt werden");
            return;
        } 
        if(data.ok) panel.showMessage(root, "Der Report wurde erfolgreich erstellt", `Es wurde ein neuer Report '${reportTitle}' angelegt`);
    } catch (error) {
        console.error("Report-submit failed:", error);
    } finally {
        //hideLoader();
        panel.hideReportCreation(root, true);
    }
}

export async function loadExistingReports(root) {
    const container = root.getElementById("reportList");
    const loader    = root.querySelector("#createReport .spinner");
    if(!container) return;

    try {
        panel.showLoader(loader);

        const resp = await fetch(`${config.serverURL}/report/all`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });
        const data = await resp.json();
        if(!resp.ok) throw new Error("Network error");
        if(!Array.isArray(data) || data.length === 0) {
            container.innerHTML = "<p style='color: white;'>Keine Reports gefunden</p>";
            return;
        }
        container.innerHTML = "";
        data.forEach(({ reportType, reportTitle, report, username, timestamp }) => {
            const reportCard = root.createElement("div");
            reportCard.className = "report-card";
            reportCard.innerHTML = `
                <h3>${reportTitle ?? "<not found>"}</h3>
                <p><strong>Typ:</strong> ${reportType ?? "<not found>"}</p>
                <p><strong>Inhalt:</strong> ${report ?? "<not found>"}</p>
                <p><strong>Datum:</strong> ${timestamp ? new Date(timestamp).toLocaleString() : "<not found>"}</p>
            `
            container.appendChild(reportCard);
        });
    } catch (error) {
        console.error("Fehler:", error);
        container.innerHTML = "<p style='color: white;'>Fehler beim Laden der Reports</p>";
    } finally {
        panel.hideLoader(loader);
    }
}


// Profile Color
export async function changeProfileColor(root, btn, e) {
    if(!root || !btn || !e) return;
    if(btn.disabled == true) return;
    btn.disabled = true;
    btn.style.opacity = "0.5";
    const colorEl = e.target.closest(".colorPick");
    if(colorEl) {
        const color = colorEl.dataset.color;
        if(color) {
            await requestProfileColorChange(root, color);
        }
    }
    btn.style.opacity = "1";
    btn.disabled = false;
}
async function requestProfileColorChange(root, color) {
    const loader = root.querySelector("#panel3 .spinner");
    const userId = localStorage.getItem("userId");
    const profileImg_1 = root.getElementById("profilePicture");
    if(!userId || !color || !profileImg_1) return;
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/change/color`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, colorCode: color })
        });
        if(!resp.ok) throw new Error("Interner Error");
        panel.showMessage(root, "Erfolgreiche Farbänderung", "Die Profil-Farbe wurde erfolgreich geändert.");
        if(color === "#000000") {
            profileImg_1.style.filter = "";
            profileImg_2.style.filter = "";
        } else {
            profileImg_1.style.filter = `drop-shadow(0px 0px 5px ${color})`;
        }
    } catch (error) {
        console.error("Failed to change Account-color:", error);
        panel.showMessage(root, "Fehler bei der Farbänderung", "Die Profil-Farbe konnte nicht geändert werden.");
    } finally {
        panel.hideLoader(loader);
    }
}


// Profile Visibility
export async function changeProfileVisibility(root, toggle, e) {
    if(!root || !toggle) return;
    if(toggle.disabled == true) return;
    toggle.disabled = true;
    e.target.closest(".toggle").style.opacity = "0.5";
    await requestVisibilityChange(root, toggle.checked);
    toggle.disabled = false;
    e.target.closest(".toggle").style.opacity = "1";    
}
async function requestVisibilityChange(root, visible) {
    const loader        = root.querySelector(".userName .spinner");
    const userId        = localStorage.getItem("userId");
    let visibleStatus   = visible ? 1: 0;
    
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/change/visibility`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, visibility: visibleStatus })
        });
        if(!resp.ok) throw new Error("Network error");
        panel.showMessage(root, "Sichtbarkeit wurde geändert", "Änderung des Sichtbarkeits-Status war erfolgreich.");
    } catch (error) {
        console.error("Failed to toggle Visibility:", error);
        panel.showMessage(root, "Sichtbarkeit konnte nicht geändert werden", "Es gab einen internen Fehler.");
    } finally {
        panel.hideLoader(loader);
    }
}


// Profile Name
export async function changeUserName(root, btn) {
    if(!root || !btn) return;
    if(btn.disabled == true) return;
    btn.disabled = true;
    btn.style.opacity = "0.5";
    const errMsg = root.querySelector("#nameMsg");
    const rc = await requestNameChange(root);
    if(errMsg && rc) {
        errMsg.innerText = rc.message ?? "Name konnte nicht geändert werden";
        errMsg.classList.toggle("info", rc.returnCode == 0);
        errMsg.classList.toggle("error", rc.returnCode != 0);
    }
    btn.disabled = false;
    btn.style.opacity = "1";

}
async function requestNameChange(root) {
    const loader        = root.querySelector("#nameSettings .spinner");
    const firstNameEl   = root.getElementById("firstNameEdit");
    const lastNameEl    = root.getElementById("lastNameEdit");
    const userId        = localStorage.getItem("userId");

    let firstNameInput =
        firstNameEl && firstNameEl.value.length > 0
            ? firstNameEl.value
            : firstNameEl?.placeholder;

    let lastNameInput =
        lastNameEl && lastNameEl.value.length > 0
            ? lastNameEl.value
            : lastNameEl?.placeholder;
    if(!userId) {
        return {message: "Interner Fehler - Nutzer nicht gefunden", returnCode: 1};
    }
    if(!firstNameInput || !lastNameInput || firstNameInput.length < 4 || lastNameInput.length < 4) {
        return {message: "Vor- und Nachname muss mindestens 4 Zeichen enthalten", returnCode: 2};
    }
    try {
        panel.showLoader(loader);
        const resp = await fetch(`${config.serverURL}/account/change/name`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, new_first_name: firstNameInput, new_last_name: lastNameInput })
        });
        const data = await resp.json();
        if(!data.ok) return {message: data.message ?? "Die Namensänderung war fehlerhaft", returnCode: 3};
        else {
            localStorage.setItem("user", data.new_first_name);
            if(user.setupProfile(root)) {
                panel.showMessage(root, "Name erfolgreich geändert", `Der neue Nutzername '${firstNameInput} ${lastNameInput}' wurde übernommen.`);
            }
            return {message: data.message ?? "Die Namensänderung war erfolgreich", returnCode: 0};
        }
    } catch (error) {
        console.error("Failed to save new Username:", error);
        return {message: "Netzwerkfehler beim Ändern des Namens", returnCode: 4};
    } finally {
        panel.hideLoader(loader);
    }
}
