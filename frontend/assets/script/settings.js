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
        //showMessage("Fehlende Eingaben", "Ein Report muss mindestens einen Typen und eine Beschreibung haben!");
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
        //showMessage("Report erfolgreich erstellt!", "Es wurde ein neuer Report angelegt.");
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