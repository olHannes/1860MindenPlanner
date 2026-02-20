
import * as config from "./config.js";
import * as eventListener from "./eventlistener.js";
import * as userHandling from "./user-handling.js";
import * as panel from "./panel-handling.js";


window.onload = function () {
    userHandling.startup(this.document);
    eventListener.addFunktionalEventListener(document);
};



window.addEventListener("popstate", function (event) {
    return;
    if(!event.state) return;
    const root = this.document;

    // Download-Panel
    if (event.state.page === "download") {
        panel.showDownloads(root, false);
    } else {
        panel.hideDownloads(root, false);
    }
    
    // News-Panel
    if (event.state.page === "news") {
        panel.showNews(root, false);
    } else {
        panel.hideNews(root, false);
    }

    // Report-Formular
    if (event.state.page === "createReport") {
        panel.showReportCreation(root, false);
    } else {
        panel.hideReportCreation(root, false);
    }
});

/*
//----------------------------------------------------------------------------------------------------------------- hide info
document.addEventListener("DOMContentLoaded", function() {
    loadMaxPoints();


    document.getElementById("filterLearnedElements").addEventListener("change", function () {
        activeFilter_learnedElem = this.checked;
        getFilteredElementList();
      });
});
*/

/*
//----------------------------------------------------------------------------------------------------------------- handle loader
let loaderTimeout=null;
function showLoader(){
    clearTimeout(loaderTimeout);
    document.getElementById('loadingBackground').style.display="block";
    document.getElementById('loadingContainer').style.display="block";

    loaderTimeout = setTimeout(function() {
        document.getElementById('loadingMsg').style.display = "block";
    }, 5000);
}
function hideLoader(){
    document.getElementById('loadingBackground').style.display="none";
    document.getElementById('loadingContainer').style.display="none";
    clearTimeout(loaderTimeout);
    document.getElementById('loadingMsg').style.display = "none";
}
*/


//----------------------------------------------------------------------------------------------------------------- Login Handling
/*
// Update User Status
async function checkUserStatus() {
    const username = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");

    if (!username || !userId) return;

    showLoader();
    try {
        const response = await fetch(`${serverURL}/account/checkUserStatus?name=${username}&userId=${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Fehler: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        hideLoader();

        if (data.message === "Benutzer offline!") {
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            localStorage.removeItem("adminKey");
        } else {
            setProfileName(); // user-handling.setupProfile(root);
            checkLoginStatus(); // panel.applyLoginStatus(root);
            loadMaxPoints();
        }

    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        showNameError();
    }
}
*/

/*
// safe password-Edit
async function updatePassword(newPassword) {
    const userId = localStorage.getItem("userId");

    if (!newPassword || !userId) {
        document.getElementById('passwordEdit').style.display = "none";
        document.getElementById('nameView').style.display = "block";
        return;
    }
    try {
        const response = await fetch(`${serverURL}/account/updatePassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                newPassword: newPassword
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Fehler beim Aktualisieren des Passworts");
        }
        showMessage("Passwort erfolgreich geändert", "Die Passwortänderung wurde erfolgreich übernommen.");
    } catch (error) {
        showMessage("Fehlerhafte Passwortaktualisierung", "Das Passwort konnte nicht geändert werden!");
    }
    document.getElementById('passwordEdit').style.display = "none";
    document.getElementById('nameView').style.display = "block";   
}
function cancleEdits(){
    document.getElementById('nameEdit').style.display="none";
    document.getElementById('passwordEdit').style.display="none";
}
*/
/*
async function showMemberData(username) {
    showLoader();
    document.getElementById('memberExerciseList').style.display = "block";
    let memberExerciseList = document.getElementById('memberExerciseList');
    memberExerciseList.innerHTML = `
        <button onclick="hideMemberExerciseList();" id="hideMemberExercise">
            <img src="frontend/assets/images/system/back.png" alt="Go Back Btn" class="goBack-Btn">
        </button>
        <h2 id="memberName">${username}</h2>
        <div id="exerciseContainer"></div>
    `;

    const userExerciseList = await getAllUserExercise(username);
    const deviceNames = {
        "FL": "Boden",
        "PO": "Pauschenpferd",
        "RI": "Ringe",
        "VA": "Sprung",
        "PA": "Barren",
        "HI": "Reck"
    };

    let exerciseContainer = document.getElementById('exerciseContainer');

    for (const { device, exercises } of userExerciseList) {
        let deviceButton = document.createElement("button");
        deviceButton.className = "device-button";

        let deviceNameSpan = document.createElement("span");
        deviceNameSpan.className = "device-name";
        deviceNameSpan.innerText = deviceNames[device];

        let difficultySpan = document.createElement("span");
        difficultySpan.className = "device-difficulty";

        deviceButton.appendChild(deviceNameSpan);
        deviceButton.appendChild(difficultySpan);
        deviceButton.setAttribute("onclick", `toggleExercise('${device}')`);

        let exerciseDiv = document.createElement("div");
        exerciseDiv.id = `exercise-${device}`;
        exerciseDiv.style.display = "none";

        if (exercises && exercises.elemente && exercises.elemente.length > 0) {
            let table = document.createElement("table");
            table.className = "exercise-table";
            
            let thead = document.createElement("thead");
            thead.innerHTML = "<tr><th>Nr</th><th>Name</th><th>Bild</th></tr>";
            table.appendChild(thead);

            let tbody = document.createElement("tbody");
            let elements = [];

            for (let i = 0; i < exercises.elemente.length; i++) {
                let element = exercises.elemente[i];
                if (!element) continue;
                
                element = await getElementDetails(element, false);
                if (!element) continue;
                
                elements.push(element);

                let row = document.createElement("tr");
                row.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${element.bezeichnung}</td>
                    <td><img src="${element.image_path || "frontend/assets/images/system/profile_icon.png"}" alt="${element.bezeichnung}" style="max-width: 100px;"></td>
                `;
                tbody.appendChild(row);
            }
            table.appendChild(tbody);
            exerciseDiv.appendChild(table);

            // ✅ Validierung
            let { warnings, errors, totalDifficulty, totalElements, groupList, isComplete, baseDifficulty, groupBonus, dismountBonus } = await validRoutine(elements, device);

            difficultySpan.innerText = totalDifficulty.toFixed(2);

            // ⚠️ Fehler und Warnungen
            let summary = document.createElement("div");
            summary.className = "exercise-summary";
            summary.innerHTML = `
                ${warnings.length > 0 ? `<p style="color: orange;"><strong>⚠️ Warnungen:</strong> ${warnings.join(" | ")}</p>` : ""}
                <p><strong>Gesamtanzahl der Elemente:</strong> ${totalElements}</p>
                <p><strong>Gesamte Schwierigkeit:</strong> ${totalDifficulty.toFixed(2)}</p>
                <p><strong>vorhandene Elementgruppen:</strong> ${groupList || "Keine"}</p>
                <p><strong>Übung vollständig:</strong> 
                    <span style="color: ${isComplete ? "green" : "red"}; font-weight: bold;">
                        ${isComplete ? "✅ Ja" : "❌ Nein"}
                    </span>
                </p>
                ${errors.length > 0 ? `<p style="color:red;"><strong>Fehler:</strong> ${errors.join(" | ")}</p>` : ""}
            `;
            exerciseDiv.appendChild(summary);

            try {
                const response = await fetch(`${serverURL}/exercise/rating?vorname=${encodeURIComponent(username)}&geraet=${encodeURIComponent(device)}&routineType=${encodeURIComponent(0)}`);
                if (!response.ok) throw new Error("Fehler beim Laden der Bewertung");

                const data = await response.json();
                const rating = parseFloat(data.durchschnitt);

                if (!isNaN(rating) && data.anzahl>0) {
                    const starContainer = document.createElement("div");
                    starContainer.className = "star-rating";

                    let fullStars = Math.floor(rating);
                    let halfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
                    let emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

                    for (let i = 0; i < fullStars; i++) {
                        starContainer.innerHTML += "★";
                    }
                    if (halfStar) {
                        starContainer.innerHTML += "⯨";
                    }
                    for (let i = 0; i < emptyStars; i++) {
                        starContainer.innerHTML += "☆";
                    }

                    starContainer.title = `Bewertung: ${rating.toFixed(1)} von 5`;
                    starContainer.style.fontSize = "1.4em";
                    starContainer.style.color = "#f7c400";
                    starContainer.style.marginBottom = "8px";

                    exerciseDiv.appendChild(starContainer);
                }
            } catch (error) {
                console.warn("Konnte Bewertung nicht laden:", error);
            }

            let ratingBtn = document.createElement("button");
            ratingBtn.setAttribute("onclick", `showRatingPanel('${username}', '${device}');`);
            ratingBtn.className="ratingBtn";
            ratingBtn.innerText="Übung bewerten";
            if(username != localStorage.getItem("user")){
                exerciseDiv.appendChild(ratingBtn);
            }
        } else {
            exerciseDiv.innerHTML = `<p>Keine Übungen gefunden</p>`;
        }
        exerciseContainer.appendChild(deviceButton);
        exerciseContainer.appendChild(exerciseDiv);
    }
    hideLoader();
}
*/
/*
async function validRoutine(elements, device) {
    try {
        const response = await fetch(`${serverURL}/routine/get/validation`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                device: device,
                elementList: elements
            })
        });

        const {
            warnings,
            errors,
            totalDifficulty,
            totalElements,
            groupList,
            isComplete,
            baseDifficulty,
            groupBonus,
            dismountBonus
        } = await response.json();

        return {
            warnings,
            errors,
            totalDifficulty,
            totalElements,
            groupList,
            isComplete,
            baseDifficulty,
            groupBonus,
            dismountBonus
        };
    } catch (error) {
        console.error("Fehler bei validRoutine:", error);
        return null;
    }
}
*/
/*
function openDevicePanel(id) {
    pageDepth = 0;
    document.getElementById('EquipmentExercise').style.display = "block";
    const deviceImage = document.getElementById('DeviceImage');
    const headerDe = document.getElementById('Device-de');
    const headerEn = document.getElementById('Device-en');
    const infoBlock = document.getElementById('infoBlock'); 
    const createRoutineBtn = document.getElementById('createRoutineBtn');

    let deviceData = {};
    currentExercise = [];
    currentExerciseDetailedList = [];
    routineType = "0";


    switch (id) {
        case 0:
            deviceData = {
                img: "frontend/assets/images/equipment/Floor_icon.png",
                de: "Boden",
                en: "Floor",
                info: `
                    <h3>Allgemeine Infos</h3>
                    <p><b>Anzahl der Elemente:</b> 6 + Abgang</p>
                    <p><b>Maße der Bodenfläche:</b> 12 x 12m</p>
                    <p><b>Dauer der Übung:</b> max. 75 Sek.</p>
                    <h3>Elementegruppen</h3>
                    <ul>
                        <li>1: Nicht-akrobatische Elemente</li>
                        <li>2: Akrobatische Elemente vorwärts</li>
                        <li>3: Akrobatische Elemente rückwärts</li>
                    </ul>
                `
            };
            createRoutineBtn.style.bottom="0";
            currentDevice="FL";
            break;

        case 1:
            deviceData = {
                img: "frontend/assets/images/equipment/Pommelhorse_icon.png",
                de: "Pauschenpferd",
                en: "Pommel Horse",
                info: `
                    <h3>Allgemeine Infos</h3>
                    <p><b>Anzahl der Elemente:</b> 6 + Abgang</p>
                    <p><b>Übungsbeginn:</b> immer mit geschlossenen Beinen</p>
                    <h3>Elementegruppen</h3>
                    <ul>
                        <li>1: Einbeinschwünge und Scheren</li>
                        <li>2: Kreis- und Thomasflanken, Kehrschwünge, Russenwendeschwünge</li>
                        <li>3: Wanderelemente (z. B. Tong Fei, Wu Guonian)</li>
                        <li>4: Abgänge</li>
                    </ul>
                `
            };
            createRoutineBtn.style.bottom="0";
            currentDevice="PO";
            break;

        case 2:
            deviceData = {
                img: "frontend/assets/images/equipment/Rings_icon.png",
                de: "Ringe",
                en: "Rings",
                info: `
                    <h3>Allgemeine Infos</h3>
                    <p><b>Anzahl der Elemente:</b> 6 + Abgang</p>
                    <p><b>Übungsbeginn:</b> immer im ruhigen Hang mit gestreckten Armen und Beinen</p>
                    <h3>Elementegruppen</h3>
                    <ul>
                        <li>1: Kippen und Schwungelemente, Schwünge durch den Handstand</li>
                        <li>2: Kraft- und Halteelemente</li>
                        <li>3: Schwung zu Kraftelementen</li>
                        <li>4: Abgänge</li>
                    </ul>
                `
            };
            createRoutineBtn.style.bottom="0";
            currentDevice="RI";
            break;

        case 3:
            deviceData = {
                img: "frontend/assets/images/equipment/Vault_icon.png",
                de: "Sprung",
                en: "Vault",
                info: `
                    <h3>Allgemeine Infos</h3>
                    <p><b>Anzahl der Sprünge:</b> 2 (auch aus unterschiedlichen Gruppen)</p>
                    <h3>Sprunggruppen</h3>
                    <ul>
                        <li>1: Salti mit oder ohne Drehungen</li>
                        <li>2: Überschlagssprünge ohne oder mit Drehungen</li>
                        <li>3: Überschlagsprünge seitwärts und Tsukahara-Sprünge</li>
                        <li>4: Rondatsprünge</li>
                    </ul>
                `
            };
            createRoutineBtn.style.bottom="0";
            currentDevice="VA";
            break;

        case 4:
            deviceData = {
                img: "frontend/assets/images/equipment/Parralelbars_icon.png",
                de: "Barren",
                en: "Parallel Bars",
                info: `
                    <h3>Allgemeine Infos</h3>
                    <p><b>Anzahl der Elemente:</b> 6 + Abgang</p>
                    <p><b>Höhe:</b> 180cm (ab Mattenoberkante), 200cm (ab Boden)</p>
                    <h3>Elementegruppen</h3>
                    <ul>
                        <li>1: Elemente im Stütz oder durch den Stütz auf beiden Holmen</li>
                        <li>2: Elemente, die im Oberarmstütz beginnen</li>
                        <li>3: Schwungelemente durch den Hang an 1 oder 2 Holmen</li>
                        <li>4: Abgänge</li>
                    </ul>
                `
            };
            createRoutineBtn.style.bottom="-1%";
            currentDevice="PA";
            break;

        case 5:
            deviceData = {
                img: "frontend/assets/images/equipment/Highbar_icon.png",
                de: "Reck",
                en: "High Bar",
                info: `
                    <h3>Allgemeine Infos</h3>
                    <p><b>Anzahl der Elemente:</b> 6 + Abgang</p>
                    <p><b>Höhe:</b> 260cm (ab Mattenoberkante), 280cm (ab Boden)</p>
                    <h3>Elementegruppen</h3>
                    <ul>
                        <li>1: Langhangschwünge mit und ohne Drehungen</li>
                        <li>2: Flugelemente</li>
                        <li>3: Stangennahe und Adler-Elemente</li>
                        <li>4: Abgänge</li>
                    </ul>
                `
            };
            createRoutineBtn.style.bottom="0";
            currentDevice="HI";
            break;

        default:
            deviceData = {
                img: "",
                de: "Unbekannt",
                en: "Unknown",
                info: "<p>Keine Informationen verfügbar.</p>"
            };
            createRoutineBtn.style.bottom="0";
    }

    deviceImage.src = deviceData.img;
    headerDe.textContent = deviceData.de;
    headerEn.textContent = deviceData.en;
    infoBlock.innerHTML = deviceData.info; 

    infoBlock.style.display="block";
    createRoutineBtn.style.display = "block";
}
*/
/*
async function  loadCurrentExercise(username, device, remote, routineType) {
    if (!username || !device) {
        console.error("Invalid Arguments for loading current Exercise", username, ", ", device);
        return;
    }
    showLoader();
    if(remote){
        if(routineType){
            await requestUserExercise(username, device, routineType);
        }
    }

    if (!currentExercise || !Array.isArray(currentExercise)) {
        console.warn("Keine gültige Übung gefunden.");
        return;
    }

    const exerciseContainer = document.getElementById("selected-exercises-list");
    exerciseContainer.innerHTML = "";

    let table = document.createElement("table");
    table.className = "exercise-table";
    table.setAttribute("id", "exerciseTable");

    let thead = document.createElement("thead");
    thead.innerHTML = `<tr><th>Nr</th><th>Name</th><th>Bild</th><th>Aktionen</th></tr>`;
    table.appendChild(thead);

    let tbody = document.createElement("tbody");
    tbody.setAttribute("id", "exerciseTbody");

    currentExerciseDetailedList.forEach((elementDetails, index) => {
        const row = createExerciseRow(elementDetails, index);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    exerciseContainer.appendChild(table);

    let safeButton = document.createElement("button");
    safeButton.innerText="Übung speichern";
    safeButton.id="safeRoutineBtn";
    safeButton.addEventListener("click", safeExercise);
    exerciseContainer.appendChild(safeButton);

    let copyButton = document.createElement("button");
    const headline = document.querySelector("#secureRoutineCopy h3");
    const validCopyBtn = document.getElementById('validCopyRoutine');
    copyButton.id = "copyToBtn";
    copyButton.style.backgroundColor="#e4e5e4";
    copyButton.innerText = routineType == 0? "Übung als Wunsch-Übung speichern" : "Übung als Wettkampf-Übung speichern";
    headline.innerText = routineType == 0? "Aktuelle Übung als Wunsch-Übung speichern?": "Aktuelle Übung als Wettkampf-Übung speichern?";
    
    validCopyBtn.removeEventListener("click", handleValidCopyClick);
    validCopyBtn.addEventListener("click", handleValidCopyClick);

    copyButton.addEventListener("click", requestCopyto);
    exerciseContainer.appendChild(copyButton);

    let summaryContainer = document.createElement("div");
    summaryContainer.id = "exercise-summary-container";
    exerciseContainer.appendChild(summaryContainer);

    let ratingContainer = document.createElement("div");
    ratingContainer.id = "rating-InfoPanel";
    exerciseContainer.appendChild(ratingContainer);

    updateExerciseSummary();
    showRoutineRating(localStorage.getItem("user"), currentDevice, routineType);
    hideLoader();
}
*/
/*
async function updateExerciseSummary() {
    let device = currentDevice;
    let { warnings, errors, totalDifficulty, totalElements, groupList, isComplete, baseDifficulty, groupBonus, dismountBonus } = await validRoutine(currentExerciseDetailedList, device);
    
    let summaryContainer = document.getElementById("exercise-summary-container");
    if (!summaryContainer) return;

    if(!totalElements){
        summaryContainer.innerHTML = `
        <p><strong>Die Übung ist leer</strong></p>
        `;
        return;
    }

    summaryContainer.innerHTML = `
        ${warnings.length > 0 ? `<p style="color: orange;"><strong>⚠️ Warnungen:</strong> ${warnings.join(" | ")}</p>` : ""}
        <p><strong>Anzahl der Elemente:</strong> ${totalElements}</p>
        <p style="cursor: pointer; color: #8d8d8d;" id="total-difficulty"><strong>Gesamte Schwierigkeit:</strong> 
            <span>
                ${totalDifficulty.toFixed(2)}
            </span>
            <div id="difficulty-details" style="display:none; padding-left: 20px; padding-bottom: 8px; font-size: 12px; color: #555;">
                Base Schwierigkeit: ${baseDifficulty}<br>
                Gruppen Bonus: ${groupBonus}<br>
                Abgang Bonus: ${dismountBonus}<br>
            </div>
        </p>
        <p><strong>vorhandene Elementgruppen:</strong> ${groupList || "Keine"}</p>
        <p><strong>Übung vollständig:</strong> 
            <span style="color: ${isComplete ? "green" : "red"}; font-weight: bold;">
                ${isComplete ? "✅ Ja" : "❌ Nein"}
            </span>
        </p>
        ${errors.length > 0 ? `<p style="color:red;"><strong>Fehler:</strong> ${errors.join(" | ")}</p>` : ""}
    `;

    document.getElementById("total-difficulty").addEventListener("click", function() {
        let details = document.getElementById("difficulty-details");
        details.style.display = details.style.display === "none" ? "block" : "none";
    });
}
*/
/*
async function getElements(difficulty, group, searchText, learnedElements) {
    const leftBlock = document.getElementById('leftColumn');
    const rightBlock = document.getElementById('rightColumn');
    leftBlock.innerHTML = "";
    rightBlock.innerHTML = "";
    document.getElementById('selected-exercises-list').style.display="none";
    let togglePage = true;

    let device = currentDevice;
    showLoader();
    await loadCompletedUserList(device);
    try {
        const url = new URL(`${serverURL}/elements/get/filteredList`);
        const params = { Device: device, Difficulty: difficulty , Group: group, learnedElements: learnedElements, userId: localStorage.getItem("userId"), Text: searchText };
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fehler beim Laden der Daten: ${response.statusText}`);

        const elements = await response.json();
        hideLoader();

        const selectedSort = document.getElementById("editSortType").value;

        elements.sort((a, b) => {
            switch (selectedSort) {
                case "wertigkeit-desc":
                    return b.wertigkeit - a.wertigkeit;
                case "gruppe-asc":
                    return a.elementegruppe - b.elementegruppe;
                case "gruppe-desc":
                    return b.elementegruppe - a.elementegruppe;
                case "wertigkeit-asc":
                default:
                    return a.wertigkeit - b.wertigkeit;
            }
        });

        elements.forEach(element => {
            if(document.getElementById('element-${element.id}')) {
                return;
            }
            const exerciseDiv = createElementDiv(element, togglePage, currLearnedElements.includes(element.id));
            exerciseDiv.id = `element-${element.id}`;
            
            if(currLearnedElements.includes(element.id)){
                exerciseDiv.style.backgroundColor="#219633";
            }
            togglePage ? leftBlock.appendChild(exerciseDiv) : rightBlock.appendChild(exerciseDiv);
            togglePage = !togglePage;
        });
    } catch (error) {
        hideLoader();
        console.error("Fehler beim Abrufen der Übungen:", error);
    }
}
*/
/*
async function getElementDetails(elementId, loaderFlag) {
    if(loaderFlag){
        showLoader();
    }  
    try {
        const deviceCode = elementId.substring(0, 2);
        const response = await fetch(`${serverURL}/exercise/get_element?id=${elementId}&currentDevice=${deviceCode}`);
        const elementDetails = await response.json();
        if (response.ok && elementDetails) {
            if(loaderFlag){
                showLoader();
            }
            return elementDetails;
        } else {
            console.error("Element konnte nicht abgerufen werden:", elementId);
            if(loaderFlag){
                showLoader();
            }
            return null;
        }
    } catch (error) {
        console.error("Fehler beim Abrufen des Elements:", error);
        if(loaderFlag){
            showLoader();
        }
        return null;
    }
}
*/
/*
async function addToCompleted(element) {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        console.error("Kein Benutzer-ID im Local Storage gefunden.");
        return;
    }
    try {
        const response = await fetch(`${serverURL}/account/addLearnedElement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                elementCode: element,
            }),
        });

        const data = await response.json();
        if (response.ok) {
            setLearnedButton(false, element);
            if(!currLearnedElements.includes(element)){
                currLearnedElements.push(element);
            }
        } else {
            console.error("Fehler beim Hinzufügen des Elements:", data.message);
        }
    } catch (error) {
        console.error("Fehler bei der Anfrage:", error);
    }
}
*/