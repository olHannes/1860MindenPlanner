import * as panel from "./panel-handling.js";
import * as config from "./config.js";

export async function submitReport(root) {
    const selectedValue = root.getElementById("reportType")?.value;
    const reportTitle = root.getElementById("reportTitle")?.value?.trim();
    const reportTxt = root.getElementById("reportTxt")?.value?.trim();
    const username = localStorage.getItem("user");

    if(!username) {
        panel.hideReportCreation(root, true);
        return;
    }
    if(!selectedValue || !reportTitle || !reportTxt) {
        panel.showMessage(root, "Fehlende Eingaben", "Ein Report muss mindestens einen Typen und eine Beschreibung haben!");
        panel.hideReportCreation(root, true);
        return;
    }
    //showLoader();
    try {
        const resp = await fetch(`${config.serverURL}/report/issue`, {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({ username: username, reportType: selectedValue, reportTitle: reportTitle, report: reportTxt })
        });
        const data = await resp.json();
        if(!resp.ok) throw new Error("Network error");
        panel.showMessage(root, "Der Report wurde erfolgreich erstellt", `Es wurde ein neuer Report '${reportTitle}' angelegt`);
    } catch (error) {
        console.error("Report-submit failed:", error);
    } finally {
        //hideLoader();
        panel.hideReportCreation(root, true);
    }
}

export async function loadExistingReports(root) {
    const container = root.getElementById("reportList");
    const loader    = root.getElementById("reportLoader");
    if(!container || !loader) return;

    loader.style.display = "block";
    try {
        await new Promise(r => setTimeout(r, 2000));

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
        loader.style.display = "none";
    }
}


/* User Settings */
export async function changeProfileColor(root, color) {
    const userId = localStorage.getItem("userId");
    const profileImg_1 = root.getElementById("profilePicture");
    const profileImg_2 = root.getElementById("profilePictureOptions");
    if(!userId || !color || !profileImg_1 || !profileImg_2) return;
    try {
        //showLoader();
        const resp = await fetch(`${config.serverURL}/account/user/colorChange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, colorCode: color })
        });
        const data = await resp.json();
        if(!resp.ok) throw new Error("Network error");
        
        panel.showMessage(root, "Erfolgreiche Farbänderung", "Die Profil-Farbe wurde erfolgreich geändert.");
        if(color === "#000000") {
            profileImg_1.style.filter = "";
            profileImg_2.style.filter = "";
        } else {
            profileImg_1.style.filter = `drop-shadow(0px 0px 5px ${color})`;
            profileImg_2.style.filter = `drop-shadow(0px 0px 5px ${color})`;
        }
    } catch (error) {
        console.error("Failed to change Account-color:", error);
    } finally {
        //hideLoader();
    }
}

export async function changeProfileVisibility(root, visible) {
    const userId = localStorage.getItem("userId");
    let visibleStatus = visible ? 1: 0;
    
    try {
        //showLoader();
        const resp = await fetch(`${config.serverURL}/account/user/visibilityChange`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, visibility: visibleStatus })
        });
        const data = await resp.json();
        if(!resp.ok) throw new Error("Network error");
        panel.showMessage(root, "Sichtbarkeit wurde geändert", "Änderung des Sichtbarkeits-Status war erfolgreich.");
    } catch (error) {
        console.error("Failed to toggle Visibility:", error);
    } finally {
        //hideLoader();
    }
}