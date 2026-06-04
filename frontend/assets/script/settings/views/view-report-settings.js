
import { clearHTML, clearValue, hide, hideFloatingBackground, hideLoader, show, showFloatingBackground, showLoader, showMessage } from "../../panel-handling.js";
import { requestExistingReports, requestSubmitReport } from "../api.js";


export function bindReportEvents(root) {
    const container = root.querySelector("#createReport");
    container?.addEventListener("click", (e) => {
        const target = e.target.closest("[data-action]");
        if(!target) return;

        const action = target.dataset.action;
        console.log("action: ", action);

        if(action === "cancel-report-creation") {
            hideReportView(root);

        } else if(action === "submit-report") {
            submitReport(root);

        }
    });

    const reportTypeSelector = root.querySelector("#reportType");
    reportTypeSelector?.addEventListener("change", () => {
        const headline = root.querySelector("#createReport h2");
        const selectedVal = reportTypeSelector.value;
        if(!headline || !selectedVal) return;
        headline.innerText = selectedVal + " melden";
    });
}



export function showReportView(root) {
    if(!root) return;
    clearValue(root.querySelector("#reportTitle"));
    clearValue(root.querySelector("#reportTxt"));
    clearHTML(root.querySelector("#reportList"));
    
    renderExistingReports(root);
    showFloatingBackground(root);
    show(root.querySelector("#createReport"), "block");
}


export function hideReportView(root) {
    hideFloatingBackground(root);
    hide(root.querySelector("#createReport"));
}


export async function submitReport(root) {
    const selectedValue = root.querySelector("#reportType")?.value;
    const title         = root.querySelector("#reportTitle")?.value.trim();
    const txt           = root.querySelector("#reportTxt")?.value.trim();

    const result = await requestSubmitReport({
        reportType: selectedValue,
        reportTitle: title,
        report: txt
    });
    showMessage(root, result.ok ? "Report wurde erfolgreich erstellt" : "Report konnte nicht erstellt werden", result.message);
    hideReportView(root);
} 



function buildReportCard(root, element) {
    const reportCard = root.createElement("div");
    reportCard.className = "report-card";
    reportCard.innerHTML = `
        <h3>${element.reportTitle ?? "<not found>"}</h3>
        <p><strong>Typ:</strong> ${element.reportType ?? "<not found>"}</p>
        <p><strong>Inhalt:</strong> ${element.report ?? "<not found>"}</p>
        <p><strong>Datum:</strong> ${element.timestamp ? new Date(element.timestamp).toLocaleString() : "<not found>"}</p>
    `;
    return reportCard;
}

export async function renderExistingReports(root) {
    const container = root.querySelector("#reportList");
    const loader = root.querySelector("#createReport .spinner");
    if(!container) return;

    clearHTML(container);
    showLoader(loader);
    const result = await requestExistingReports();

    if(result.ok) {
        result.reports.forEach(element => {
            container.appendChild(buildReportCard(root, element));
        });
    } else {
        const emptyP = root.createElement("p");
        p.innerText = "Bisher gibt es keine Reports";
        p.className = "info";
        container.appendChild(p);
    }
    hideLoader(loader);
}