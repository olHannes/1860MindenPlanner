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


/* User Settings */
export async function changeProfileColor(root, color) {
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

export async function changeProfileVisibility(root, visible) {
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