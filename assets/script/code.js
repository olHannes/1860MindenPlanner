//window.onload = checkLoginStatus;

window.onload = function () {
    checkUserStatus();
};


function showLoader(){
    document.getElementById('loadingBackground').style.display="block";
    document.getElementById('loadingContainer').style.display="block";
}
function hideLoader(){
    document.getElementById('loadingBackground').style.display="none";
    document.getElementById('loadingContainer').style.display="none";
}

//----------------------------------------------------------------------------------------------------------------- Page change

let activePanel = null;

function togglePanel(panelId) {
    const panel = document.getElementById('panel' + panelId);
    if (activePanel && activePanel !== panel) {
        activePanel.classList.remove('visible');
    }
    
    if (!panel.classList.contains('visible')) {
        panel.classList.add('visible');
        activePanel = panel;
    } else {
        panel.classList.remove('visible');
        activePanel = null;
    }
    resetAllPanels();
}

function resetAllPanels(){
    currentExercise=[];
    currentDevice="";

    document.getElementById('requestDelAcc').style.display="none";
    document.getElementById('nameEdit').style.display="none";

    document.getElementById('EquipmentExercise').style.display="none";
    document.getElementById('exerciseCreationPanel').style.display="none";
    document.getElementById('detailedElementInfo').style.display="none";

    document.getElementById('leftColumn').innerHTML="";
    document.getElementById('rightColumn').innerHTML="";

    document.getElementById('memberExerciseList').style.display="none";
    document.getElementById('memberExerciseList').innerHTML="";

    
}

//----------------------------------------------------------------------------------------------------------------- Registration

function toggleRegistration() {
    document.getElementById("login_mask").style.display = "none";
    document.getElementById("registration_mask").style.display = "block";
}

function cancelRegistration() {
    document.getElementById("login_mask").style.display = "block";
    document.getElementById("registration_mask").style.display = "none";
    clearLoginInput();
}

async function register() {
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        document.getElementById("errorMsgRegister").textContent = "Passwörter stimmen nicht überein!";
        return;
    }

    try {
        showLoader();
        const response = await fetch("http://127.0.0.1:5000/account/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, password: newPassword })
        });

        const data = await response.json();
        hideLoader();
        if (response.ok && data.message === "Registrierung erfolgreich!") {
            cancelRegistration();
            document.getElementById("errorMsgRegister").textContent = "";
            clearLoginInput();
            document.getElementById("errorMsg").textContent = "Nutzer erfolgreich registriert!";
        } else {
            document.getElementById("errorMsgRegister").textContent = "Benutzername bereits vergeben!";
        }
    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        document.getElementById("errorMsgRegister").textContent = "Ein unerwarteter Fehler ist aufgetreten!";
    }
}

//----------------------------------------------------------------------------------------------------------------- Login

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    showLoader();
    try {
        const response = await fetch("http://127.0.0.1:5000/account/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        hideLoader();

        if (response.ok && data.message === "Login erfolgreich!") {
            localStorage.setItem("user", username);
            setProfileName();
            checkLoginStatus();
        } else if (response.status === 403) {
            document.getElementById("errorMsg").textContent = "Benutzer bereits auf einem anderen Gerät eingeloggt!";
        } else {
            document.getElementById("errorMsg").textContent = "Ungültiger Benutzername oder Passwort!";
        }
    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Ein unerwarteter Fehler ist aufgetreten!";
    }
}

//----------------------------------------------------------------------------------------------------------------- User Status

async function checkUserStatus() {
    const username = localStorage.getItem("user");

    if (!username) return;

    showLoader();
    try {
        const response = await fetch(`http://127.0.0.1:5000/account/checkUserStatus?name=${username}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Fehler: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        hideLoader();

        if (data.message === "Benutzer offline, Status zurückgesetzt!") {
            localStorage.removeItem("user");
            window.location.href = "/login";
        }

    } catch (error) {
        hideLoader();
        console.error("Error:", error);
    }
}


//----------------------------------------------------------------------------------------------------------------- Logout

async function logout() {
    const username = localStorage.getItem("user");
    console.log(username);
    if (!username) {
        document.getElementById("errorMsg").textContent = "Kein Benutzer eingeloggt!";
        return;
    }

    showLoader();
    try {
        const response = await fetch("http://127.0.0.1:5000/account/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username })
        });

        const data = await response.json();
        hideLoader();

        if (response.ok && data.message === "Erfolgreich ausgeloggt!") {
            localStorage.removeItem("user");
            checkLoginStatus();
        } else {
            document.getElementById("errorMsg").textContent = data.message || "Unbekannter Fehler!";
        }

    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Fehler beim Logout!";
    }
}


//----------------------------------------------------------------------------------------------------------------- Auto Logout

window.onbeforeunload = async function () {
    const username = localStorage.getItem("user");

    if (!username) return;

    showLoader();
    try {
        const response = await fetch("http://127.0.0.1:5000/account/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username })
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Logout: ${response.status} ${response.statusText}`);
        }
        localStorage.removeItem("user");
        hideLoader();
    } catch (error) {
        hideLoader();
        console.error("Error beim Verlassen der Seite:", error);
    }
};


//----------------------------------------------------------------------------------------------------------------- Delete Account

function requestDeleteAcc(){
    document.getElementById('requestDelAcc').style.display="block";
}
function cancelDeleteAcc(){
    document.getElementById('requestDelAcc').style.display="none";
}
async function deleteAccount() {
    const name = localStorage.getItem("user");
    showLoader();
    try {
        const response = await fetch("http://127.0.0.1:5000/account/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({name})
        });

        if (!response.ok) {
            throw new Error(`Account löschen fehlgeschlagen: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        hideLoader();
        localStorage.removeItem("user");
        checkLoginStatus();

        alert("Dein Account wurde erfolgreich gelöscht!");
        document.getElementById('requestDelAcc').style.display="none";

    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Fehler beim Löschen des Accounts!";
    }
}


//----------------------------------------------------------------------------------------------------------------- Helper Functions for User handling

function clearLoginInput(){
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("errorMsg").textContent = "";

    document.getElementById("errorMsgRegister").textContent = "";
    document.getElementById("firstName").value = "";
    document.getElementById("lastName").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
}

function checkLoginStatus() {
    const user = localStorage.getItem("user");
    if (user) {
        document.getElementById("login_mask").style.display = "none";
        document.getElementById("headline").style.display = "none";
        document.getElementById("content").style.display = "block";
        clearLoginInput();
    } else {
        document.getElementById("login_mask").style.display = "block";
        document.getElementById("headline").style.display = "block";
        document.getElementById("content").style.display = "none";
    }
}

async function setProfileName() {
    const name = localStorage.getItem("user");
    showLoader();
    try {
        const response = await fetch(`http://127.0.0.1:5000/account/getUserInfo?name=${name}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Fehler: ${response.status} ${response.statusText}`);
        }
        const userInfo = await response.json();
        
        document.getElementById('Vorname').textContent = userInfo.first_name;
        document.getElementById('Nachname').textContent = userInfo.last_name;
        document.getElementById('welcomeUser').textContent = "Willkommen "+userInfo.first_name; 
        hideLoader();
    } catch (error) {
        hideLoader();
        console.error("Error:", error);
    }
}


//----------------------------------------------------------------------------------------------------------------- Account Edit
function editName() {
    const vorname = document.getElementById('Vorname').textContent;
    const nachname = document.getElementById('Nachname').textContent;

    document.getElementById('editVorname').placeholder = vorname;
    document.getElementById('editNachname').placeholder = nachname;

    document.getElementById('editVorname').value = '';
    document.getElementById('editNachname').value = '';

    document.getElementById('nameView').style.display = 'none';
    document.getElementById('nameEdit').style.display = 'block';
    document.getElementById('saveBtn').style.display = 'inline-block';
}

async function saveName() {
    const vorname = document.getElementById('editVorname').value || document.getElementById('editVorname').placeholder;
    const nachname = document.getElementById('editNachname').value || document.getElementById('editNachname').placeholder;
    const username = localStorage.getItem("user");

    document.getElementById('Vorname').textContent = vorname;
    document.getElementById('Nachname').textContent = nachname;

    document.getElementById('nameView').style.display = 'block';
    document.getElementById('nameEdit').style.display = 'none';
    document.getElementById('saveBtn').style.display = 'none';
    showLoader();

    if (!username) {
        console.error("Kein Benutzername im LocalStorage gefunden.");
        return;
    }
    try {
        const response = await fetch("http://127.0.0.1:5000/account/changeData", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, new_first_name: vorname, new_last_name: nachname })
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Logout: ${response.status} ${response.statusText}`);
        }

        localStorage.removeItem("user");
        localStorage.setItem("user", vorname);
        hideLoader();
    } catch (error) {
        hideLoader();
        console.error("Error beim Verlassen der Seite:", error);
    }
}


async function getAllUser() {
    showLoader();
    try {
        const response = await fetch(`http://127.0.0.1:5000/users/getUsers`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Fehler: ${response.status} ${response.statusText}`);
        }
        const userData = await response.json();
        hideLoader();
        return userData;
    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        return [];
    }
}

async function showAllUser() {
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';

    showLoader();
    const data = await getAllUser();
    data.forEach(user => {
        const memberDiv = document.createElement('div');
        memberDiv.classList.add('member');
        memberDiv.onclick = () => showMemberData(user.firstName);

        memberDiv.innerHTML = `
            <img src="assets/images/system/profile_icon.png" alt="profile icon">
            <span class="name-de">${user.firstName}</span>
            <span class="name-en">${user.lastName}</span>
        `;

        memberList.appendChild(memberDiv);
    });
    hideLoader();
}



//-----------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------- Ab hier: Übung handling
//-----------------------------------------------------------------------------------------------------------------


let currentExercise = [];
let currentDevice = null;



// get the exercise for a special user and device
async function requestUserExercise(username, device) {
    currentExercise = [];
    showLoader();
    try {
        if (!username || !device) throw new Error("Exercise request failed: Invalid params");
        const response = await fetch(`http://127.0.0.1:5000/exercise/get?device=${device}&vorname=${username}`);
        
        if (response.ok) {
            const exerciseData = await response.json();

            if (exerciseData.elemente) {
                exerciseData.elemente.forEach(element => {
                    if (element != null){
                        currentExercise.push(element);
                    }
                });
            }
            hideLoader();
            console.log("loaded Exercise: ", currentExercise);
            return exerciseData;
        } 
        if (response.status === 404) {
            console.log(`${device}-leer`);
            hideLoader();
            return null;
        }
        throw new Error("Error while fetching the user-exercise.");
    } catch (error) {
        hideLoader();
        console.error("/exercise/get error: ", error);
        return null;
    }
}

// show all Exercises of a choosen User
async function getAllUserExercise(username) {
    // Geräte-Liste definieren
    const devices = ["FL", "PO", "RI", "VA", "PA", "HI"];
    let userExerciseList = [];

    showLoader();
    for (const currDev of devices) {
        currentDevice = currDev;
        var currentExerciseList = await requestUserExercise(username, currentDevice);
        if (currentExerciseList) {
            userExerciseList.push({ device: currDev, exercises: currentExerciseList });
        } else {
            userExerciseList.push({ device: currDev, exercises: null });
        }
    }
    hideLoader();
    return userExerciseList;
}

// use getAllUserExercise and requestUserExercise to create the inner HTML to show the users data
async function showMemberData(username) {
    document.getElementById('memberExerciseList').style.display = "block";
    
    let memberExerciseList = document.getElementById('memberExerciseList');
    memberExerciseList.innerHTML = `
        <button onclick="hideMemberExerciseList();" id="hideMemberExercise">
            <img src="assets/images/system/back.png" alt="Go Back Btn" class="goBack-Btn">
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

    const requiredGroups = {
        "FL": new Set(["1", "2", "3"]), 
        "PO": new Set(["1", "2", "3", "4"]), 
        "RI": new Set(["1", "2", "3", "4"]), 
        "VA": new Set([]), 
        "PA": new Set(["1", "2", "3", "4"]), 
        "HI": new Set(["1", "2", "3", "4"]) 
    };

    let exerciseContainer = document.getElementById('exerciseContainer');

    for (const { device, exercises } of userExerciseList) {
        let deviceButton = document.createElement("button");
        deviceButton.className = "device-button";
        deviceButton.innerText = deviceNames[device];
        deviceButton.setAttribute("onclick", `toggleExercise('${device}')`);
        
        let exerciseDiv = document.createElement("div");
        exerciseDiv.id = `exercise-${device}`;
        exerciseDiv.style.display = "none";

        if (exercises && exercises.elemente) {
            let table = document.createElement("table");
            table.className = "exercise-table";
            
            let thead = document.createElement("thead");
            thead.innerHTML = "<tr><th>Nr</th><th>Name</th><th>Bild</th></tr>";
            table.appendChild(thead);

            let tbody = document.createElement("tbody");

            let totalDifficulty = 0;
            let elementGroups = new Map();
            let hasDismount = false;
            let seenElements = new Map();

            for (let i = 0; i < exercises.elemente.length; i++) {
                let element = exercises.elemente[i];
                if(element==null){
                    continue;
                }
                element = await getElementDetails(element);
                if(!element) continue;
                let row = document.createElement("tr");

                let numCell = document.createElement("td");
                numCell.innerText = i + 1;
                row.appendChild(numCell);

                let nameCell = document.createElement("td");
                nameCell.innerText = element.bezeichnung;
                row.appendChild(nameCell);

                let imgCell = document.createElement("td");
                let img = document.createElement("img");
                img.src = element.image_path || "assets/images/system/profile_icon.png";
                img.alt = element.bezeichnung;
                img.style.maxWidth = "100px";
                imgCell.appendChild(img);
                row.appendChild(imgCell);

                tbody.appendChild(row);

                totalDifficulty += parseFloat(element.wertigkeit) || 0;
                if (element.elementegruppe) {
                    elementGroups.set(element.elementegruppe, (elementGroups.get(element.elementegruppe) || 0) + 1);
                }
                if (element.dismount) {
                    hasDismount = true;
                }
                
                if (element.bezeichnung) {
                    seenElements.set(element.bezeichnung, (seenElements.get(element.bezeichnung) || 0) + 1);
                }
            }
            table.appendChild(tbody);
            exerciseDiv.appendChild(table);

            let requiredGroupSet = requiredGroups[device];
            let missingGroups = [...requiredGroupSet].filter(group => !elementGroups.has(group));

            let summary = document.createElement("div");
            summary.className = "exercise-summary";

            let totalElements = exercises.elemente.length;
            let groupList = [...elementGroups.keys()].sort().join(", ");
            let isComplete = missingGroups.length === 0 && hasDismount;

            let warningReasons = [];
            if (totalElements > 7) {
                warningReasons.push("⚠️ Übung enthält mehr als 7 Elemente");
            }
            if (totalDifficulty < 0.3) {
                warningReasons.push("⚠️ Sehr niedrige Schwierigkeit");
            }
            if (totalDifficulty > 1) {
                warningReasons.push("⚠️ Sehr hohe Schwierigkeit");
            }
            for (let [group, count] of elementGroups.entries()) {
                if (count > 3) {
                    warningReasons.push(`⚠️ Elementgruppe ${group} kommt sehr oft vor (${count}x).`);
                }
            }
            
            let duplicateElements = [...seenElements.entries()]
                .filter(([_, count]) => count > 1)
                .map(([name, count]) => `${name} (${count}x)`);
            if (duplicateElements.length > 0) {
                warningReasons.push(`⚠️ Doppelte Elemente: ${duplicateElements.join(", ")}`);
            }

            let missingReasons = [];
            if (totalElements < 7) {
                missingReasons.push(`❌ Zu wenig Elemente: ${totalElements}`);
            }
            if (missingGroups.length > 0) {
                missingReasons.push(`❌ Fehlende Gruppen: ${missingGroups.join(", ")}`);
            }
            if (!hasDismount) {
                missingReasons.push("❌ Kein Abgang vorhanden");
            }

            summary.innerHTML = `
                ${warningReasons.length > 0 ? `<p style="color: orange;"><strong>⚠️ Warnungen:</strong> ${warningReasons.join(" | ")}</p>` : ""}
                <p><strong>Gesamtanzahl der Elemente:</strong> ${totalElements}</p>
                <p><strong>Gesamte Schwierigkeit:</strong> ${totalDifficulty.toFixed(2)}</p>
                <p><strong>Elementgruppen:</strong> ${groupList || "Keine"}</p>
                <p><strong>Übung vollständig:</strong> 
                    <span style="color: ${isComplete ? "green" : "red"}; font-weight: bold;">
                        ${isComplete ? "✅ Ja" : "❌ Nein"}
                    </span>
                </p>
                ${!isComplete ? `<p style="color:red;"><strong>Fehler:</strong> ${missingReasons.join(" | ")}</p>` : ""}
            `;
            exerciseDiv.appendChild(summary);
        } else {
            exerciseDiv.innerHTML = `<p>Keine Übungen gefunden</p>`;
        }

        exerciseContainer.appendChild(deviceButton);
        exerciseContainer.appendChild(exerciseDiv);
    }
}

//-----------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------


// toggle function to display and hide the devices
function toggleExercise(device) {
    let exerciseDiv = document.getElementById(`exercise-${device}`);
    exerciseDiv.style.display = exerciseDiv.style.display === "none" ? "block" : "none";
}

function hideMemberExerciseList() {
    let memberExerciseList = document.getElementById('memberExerciseList');
    memberExerciseList.style.display = "none";
    memberExerciseList.innerHTML = "";
}


//-----------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------


// open a device and display basic information
function openDevicePanel(id) {
    document.getElementById('EquipmentExercise').style.display = "block";
    const deviceImage = document.getElementById('DeviceImage');
    const headerDe = document.getElementById('Device-de');
    const headerEn = document.getElementById('Device-en');
    const infoBlock = document.getElementById('infoBlock'); 
    const createRoutineBtn = document.getElementById('createRoutineBtn');

    let deviceData = {};
    currentExercise = [];

    switch (id) {
        case 0:
            deviceData = {
                img: "assets/images/equipment/Floor_icon.png",
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
            currentDevice="FL";
            break;

        case 1:
            deviceData = {
                img: "assets/images/equipment/Pommelhorse_icon.png",
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
            currentDevice="PO";
            break;

        case 2:
            deviceData = {
                img: "assets/images/equipment/Rings_icon.png",
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
            currentDevice="RI";
            break;

        case 3:
            deviceData = {
                img: "assets/images/equipment/Vault_icon.png",
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
            currentDevice="VA";
            break;

        case 4:
            deviceData = {
                img: "assets/images/equipment/Parralelbars_icon.png",
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
            currentDevice="PA";
            break;

        case 5:
            deviceData = {
                img: "assets/images/equipment/Highbar_icon.png",
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
            currentDevice="HI";
            break;

        default:
            deviceData = {
                img: "",
                de: "Unbekannt",
                en: "Unknown",
                info: "<p>Keine Informationen verfügbar.</p>"
            };
    }

    deviceImage.src = deviceData.img;
    headerDe.textContent = deviceData.de;
    headerEn.textContent = deviceData.en;
    infoBlock.innerHTML = deviceData.info; 

    infoBlock.style.display="block";
    createRoutineBtn.style.display = "block";
}

// UI-Elemente ein- und ausblenden
function toggleUIElementVisibility(elements, displayValue) {
    elements.forEach(element => {
        document.getElementById(element).style.display = displayValue;
    });
}


//-----------------------------------------------------------------------------------------------------------------

// show Routine Creation Panel
function createRoutine() {
    toggleUIElementVisibility(
        ['infoBlock', 'createRoutineBtn', 'elementSelection', 'detailedElementInfo'],
        'none'
    );
    document.getElementById('exerciseCreationPanel').style.display = 'block';
    document.getElementById("selected-exercises-list").innerHTML = "";
    loadCurrentExercise(localStorage.getItem("user"), currentDevice);
}

// hide Routine Creation Panel
function closeDevice() {
    cancelElementSelection();
    toggleUIElementVisibility(
        ['EquipmentExercise', 'exerciseCreationPanel', 'detailedElementInfo'],
        'none'
    );
    toggleUIElementVisibility(['infoBlock', 'createRoutineBtn'], 'block');
}







async function loadCurrentExercise(username, device) {
    if (!username || !device) {
        console.log("Invalid Arguments for loading current Exercise", username, ", ", device);
        return;
    }

    await requestUserExercise(username, device);
    console.log("Die Aktuelle Übung ist wie folgt:", currentExercise);

    if (!currentExercise || !Array.isArray(currentExercise)) {
        console.warn("Keine gültige Übung gefunden.");
        return;
    }

    let elementDetailsList = await Promise.all(
        currentExercise.map(el => getElementDetails(el))
    );

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

    elementDetailsList.forEach((elementDetails, index) => {
        const row = createExerciseRow(elementDetails, index);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    exerciseContainer.appendChild(table);

    makeTableDraggable();
}


function createExerciseRow(elementDetails, index) {
    let row = document.createElement("tr");
    row.setAttribute("data-index", index);
    row.draggable = true;

    let numCell = document.createElement("td");
    numCell.innerText = index + 1;
    
    let nameCell = document.createElement("td");
    nameCell.innerText = elementDetails.bezeichnung || "Unbekannter Titel";

    let imgCell = document.createElement("td");
    let img = document.createElement("img");
    img.src = elementDetails.image_path || "default-image.png";
    img.style.maxWidth = "80px";
    imgCell.appendChild(img);

    let actionCell = document.createElement("td");
    let trashIcon = document.createElement("span");
    trashIcon.innerHTML = "🗑️";
    trashIcon.style.cursor = "pointer";
    trashIcon.addEventListener("click", () => removeElementFromExercise(index));
    actionCell.appendChild(trashIcon);

    row.appendChild(numCell);
    row.appendChild(nameCell);
    row.appendChild(imgCell);
    row.appendChild(actionCell);

    return row;
}

function removeElementFromExercise(index) {
    console.log("delete Element ", index+1, " from: ", currentExercise);
    if (!currentExercise) {
        console.error("Fehler: currentExercise ist nicht definiert oder enthält keine Elemente.");
        return;
    }
    currentExercise.splice(index, 1);

    let tableBody = document.getElementById("exerciseTbody");
    tableBody.innerHTML = "";

    currentExercise.forEach((elementId, newIndex) => {
        getElementDetails(elementId).then(elementDetails => {
            let row = createExerciseRow(elementDetails, newIndex);
            tableBody.appendChild(row);
        });
    });

    console.log("Element erfolgreich gelöscht: ", currentExercise);
    safeUpdateExercise(currentExercise);
}


function makeTableDraggable() {
    const tbody = document.getElementById("exerciseTbody");
    let draggedRow = null;

    tbody.addEventListener("dragstart", (event) => {
        draggedRow = event.target;
        draggedRow.style.opacity = 0.5;
    });

    tbody.addEventListener("dragover", (event) => {
        event.preventDefault();
        let targetRow = event.target.closest("tr");
        if (targetRow && targetRow !== draggedRow) {
            let rect = targetRow.getBoundingClientRect();
            let next = (event.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            tbody.insertBefore(draggedRow, next ? targetRow.nextSibling : targetRow);
        }
    });

    tbody.addEventListener("dragend", () => {
        draggedRow.style.opacity = 1;
        draggedRow = null;
        updateExerciseOrder();
    });
}

function updateExerciseOrder() {
    let newOrder = [];
    document.querySelectorAll("#exerciseTbody tr").forEach((row, index) => {
        row.querySelector("td:first-child").innerText = index + 1;
        newOrder.push(row.getAttribute("data-index"));
    });
    console.log("Übung vor der geänderten Reihenfolge: ", currentExercise);
    
    let tempList = [];
    newOrder.forEach(elementIndex => {
        if(currentExercise.length>= elementIndex && currentExercise.at(elementIndex)){
            tempList.push(currentExercise.at(elementIndex));
        }
    });
    currentExercise = tempList;
    console.log("Übung nach der neuen Reihenfolge: ", currentExercise);

    safeUpdateExercise(currentExercise);
}















//-----------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------

// show all-Elements Panel
function selectElement() {
    document.getElementById('elementSelection').style.display = "block";
    document.getElementById('add-exercise-btn').style.display = "none";  
    document.getElementById('allElemBtn').style.border = "solid 2px black";
    getElements(null);
}

// apply filter to elements
function getFilteredElementList(difficulty, clickedButton) {
    document.querySelectorAll("#chooseGroup button").forEach(btn => {
        btn.style.border = "none";
    });

    clickedButton.style.border = "solid 2px black";
    getElements(difficulty);
}

// create an element
function createElementDiv(element, togglePage) {
    const exerciseDiv = document.createElement("div");
    exerciseDiv.classList.add("exercise-item");
    exerciseDiv.onclick = () => openDetailedView(element);

    const img = document.createElement("img");
    img.src = element.image_path;
    img.alt = element.bezeichnung;
    img.classList.add("exercise-image");

    const title = document.createElement("p");
    title.textContent = element.bezeichnung;
    title.classList.add("exercise-title");

    exerciseDiv.appendChild(img);
    exerciseDiv.appendChild(title);
    return exerciseDiv;
}

// request Element List (include filter) and create the inner HTML
async function getElements(difficulty) {
    const leftBlock = document.getElementById('leftColumn');
    const rightBlock = document.getElementById('rightColumn');
    leftBlock.innerHTML = "";
    rightBlock.innerHTML = "";
    let togglePage = true;

    let device = currentDevice;
    showLoader();
    try {
        const url = new URL('http://127.0.0.1:5000/elements/getGroupElements');
        const params = { Device: device, Group: difficulty };
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fehler beim Laden der Daten: ${response.statusText}`);

        const elements = await response.json();
        hideLoader();
        elements.forEach(element => {
            const exerciseDiv = createElementDiv(element, togglePage);
            togglePage ? leftBlock.appendChild(exerciseDiv) : rightBlock.appendChild(exerciseDiv);
            togglePage = !togglePage;
        });
    } catch (error) {
        hideLoader();
        console.error("Fehler beim Abrufen der Übungen:", error);
    }
}

// cancel element selection and hide panel
function cancelElementSelection() {
    document.getElementById('elementSelection').style.display = "none";
    document.getElementById('add-exercise-btn').style.display = "block"; 
    const leftBlock = document.getElementById('leftColumn');
    const rightBlock = document.getElementById('rightColumn');
    leftBlock.innerHTML = "";
    rightBlock.innerHTML = "";  
}


//-----------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------

// Detaillierte Ansicht öffnen
function openDetailedView(element) {
    const container = document.getElementById('detailedElementInfo');
    const title = document.getElementById('elementTitle');
    const description = document.getElementById('elementText');
    const img = document.getElementById('elementImage');
    const name = document.getElementById('elementName');
    const group = document.getElementById('elementGroup');
    const difficulty = document.getElementById('elementDifficulty');
    const addButton = document.getElementById('addToList');

    title.innerText = element.bezeichnung;
    description.innerText = element.bezeichnung;
    img.src = element.image_path;
    name.innerText = element.name || "Name: _";
    group.innerText = "Elementegruppe: " + element.elementegruppe;
    difficulty.innerText = "Schwierigkeit: " + element.wertigkeit;

    addButton.replaceWith(addButton.cloneNode(true));
    document.getElementById('addToList').addEventListener("click", () => addToExercise(element));

    container.style.display = "flex";
}

// Detaillierte Ansicht schließen
function closeDetailedView() {
    document.getElementById('detailedElementInfo').style.display = "none";
}

// Elementdetails abrufen
async function getElementDetails(elementId) {
    showLoader();
    try {
        const deviceCode = elementId.substring(0, 2);
        const response = await fetch(`http://127.0.0.1:5000/exercise/get_element?id=${elementId}&currentDevice=${deviceCode}`);
        const elementDetails = await response.json();
        hideLoader();
        if (response.ok && elementDetails) {
            return elementDetails;
        } else {
            console.error("Element konnte nicht abgerufen werden:", elementId);
            return null;
        }
    } catch (error) {
        hideLoader();
        console.error("Fehler beim Abrufen des Elements:", error);
        return null;
    }
}


//-----------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------




// Übungselemente hinzufügen
function addToExercise(element) {
    document.getElementById('detailedElementInfo').style.display="none";
    currentExercise.push(element.id);
    safeUpdateExercise(currentExercise);
}

function deleteElementFromExercise(index){

}

// config Exercise and send it to backend
async function safeUpdateExercise(elementList) {
    const username = localStorage.getItem("user");
    const device = currentDevice;

    console.log(currentExercise);

    if (!username || !device) {
        console.error("Benutzername oder Gerät nicht gefunden.");
        return;
    }
    const filteredElements = elementList.filter(element => element !== null && element !== undefined);
    const payload = {
        vorname: username,
        geraet: device,
        elemente: filteredElements
    };
    showLoader();
    try {
        const response = await fetch("http://127.0.0.1:5000/exercise/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        hideLoader();
        if (response.ok) {
            console.log("Übung erfolgreich aktualisiert:", data.message);
        } else {
            console.error("Fehler beim Aktualisieren:", data.error);
        }
    } catch (error) {
        hideLoader();
        console.error("Fehler bei der Anfrage:", error);
    }
}






//#################################################################


// Übungselemente im Interface erstellen
function addElementToExercise(elementDetails, index) {
    return;
    const exerciseItem = document.createElement("div");
    exerciseItem.classList.add("exercise-item");

    const exerciseNumber = document.createElement("div");
    exerciseNumber.classList.add("exercise-number");
    exerciseNumber.innerText = index + 1;

    const exerciseImage = document.createElement("img");
    exerciseImage.classList.add("exercise-image");
    exerciseImage.src = elementDetails.image_path || "default-image.png";

    const exerciseTitle = document.createElement("div");
    exerciseTitle.classList.add("exercise-title");
    exerciseTitle.innerText = elementDetails.bezeichnung || "Unbekannter Titel";

    const trashIcon = document.createElement("span");
    trashIcon.classList.add("trash-icon");
    trashIcon.innerHTML = "&#128465;";
    trashIcon.addEventListener("click", () => removeElementFromExercise(index));

    exerciseItem.appendChild(exerciseNumber);
    exerciseItem.appendChild(exerciseImage);
    exerciseItem.appendChild(exerciseTitle);
    exerciseItem.appendChild(trashIcon);
    
    return exerciseItem;
}
