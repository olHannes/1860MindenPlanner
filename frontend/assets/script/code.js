window.onload = function () {
    checkUserStatus();
};

//----------------------------------------------------------------------------------------------------------------- heartbeat - hold server alive
function sendHeartbeat() {
    fetch('https://one860mindenplanner.onrender.com/account/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: localStorage.getItem("user") })
    })
    .then(response => response.json())
    .then(data => console.log("Heartbeat gesendet:", data))
    .catch(error => console.error("Fehler beim Senden des Heartbeats:", error));
}
setInterval(sendHeartbeat, 30000);


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

//----------------------------------------------------------------------------------------------------------------- Page change

let activePanel = null;

function togglePanel(panelId) {
    const panel = document.getElementById('panel' + panelId);

    if (activePanel && activePanel !== panel) {
        activePanel.classList.remove('visible');
    }
    if (!panel.classList.contains('visible')){
        resetPanel(panelId);
        panel.classList.add('visible');
        activePanel = panel;
    } else {
        panel.classList.remove('visible');
        activePanel = null;
    }
}


//----------------------------------------------------------------------------------------------------------------- Panel clear

function resetPanel(panelId) {
    switch (parseInt(panelId, 10)) {
        case 0:
            console.log("Reset für Panel 0");
            document.getElementById('nameEdit').style.display="none";
            document.getElementById('requestDelAcc').style.display="none";
            document.getElementById('nameView').style.display = 'block';
            break;
        case 1:
            console.log("Reset für Panel 1");
            document.getElementById('elementSelection').style.display="none";
            document.getElementById('exerciseCreationPanel').style.display="none";
            document.getElementById('EquipmentExercise').style.display="none";
            document.getElementById('add-exercise-btn').style.display = "block";  

            break;
        case 2:
            console.log("Reset für Panel 2");
            document.getElementById('memberExerciseList').style.display="none";
            document.getElementById('memberExerciseList').innerHTML="";
            break;
        default:
            console.log("Unbekanntes Panel");
            break;
    }
}


//----------------------------------------------------------------------------------------------------------------- Panel toggle

function toggleDownloadPanel(){
    const dPanel = document.getElementById('downloadPage');
    const mPanel = document.getElementById('mainPage');
    if(dPanel.style.display=="block"){
        dPanel.style.display="none";
        mPanel.style.display="block";
    } else {
        dPanel.style.display="block";
        mPanel.style.display="none";
    }
}


//----------------------------------------------------------------------------------------------------------------- Registration

function toggleRegistration() {
    document.getElementById("login_mask").style.display = "none";
    document.getElementById("registration_mask").style.display = "block";
    clearLoginInput();
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
        const response = await fetch("https://one860mindenplanner.onrender.com/account/register", {
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
        const response = await fetch("https://one860mindenplanner.onrender.com/account/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        hideLoader();

        if(response.ok && username == "admin"){
            localStorage.setItem("user", username);
            loadAdminReports();
            return;
        }

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
        const response = await fetch(`https://one860mindenplanner.onrender.com/account/checkUserStatus?name=${username}`, {
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
        }

    } catch (error) {
        hideLoader();
        console.error("Error:", error);
    }
}


//----------------------------------------------------------------------------------------------------------------- Logout

async function logout() {
    const username = localStorage.getItem("user");
    if (!username) {
        document.getElementById("errorMsg").textContent = "Kein Benutzer eingeloggt!";
        return;
    }

    showLoader();
    try {
        const response = await fetch("https://one860mindenplanner.onrender.com/account/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username })
        });

        const data = await response.json();
        hideLoader();

        if (response.ok && data.message === "Erfolgreich ausgeloggt!") {
            localStorage.removeItem("user");
            document.getElementById('AdminPage').style.display="none";
            checkLoginStatus();
        } else {
            document.getElementById("errorMsg").textContent = data.message || "Unbekannter Fehler!";
            document.getElementById('AdminPage').style.display="none";
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
        const response = await fetch("https://one860mindenplanner.onrender.com/account/logout", {
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
    document.getElementById('loadingBackground').style.display="block";
}
function cancelDeleteAcc(){
    document.getElementById('requestDelAcc').style.display="none";
    document.getElementById('loadingBackground').style.display="none";
}
async function deleteAccount() {
    const name = localStorage.getItem("user");
    showLoader();
    try {
        const response = await fetch("https://one860mindenplanner.onrender.com/account/delete", {
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


//----------------------------------------------------------------------------------------------------------------- Clear Input form

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


//----------------------------------------------------------------------------------------------------------------- toggle login panel

function checkLoginStatus() {
    const user = localStorage.getItem("user");
    if (user) {
        document.getElementById("login_mask").style.display = "none";
        document.getElementById("headline").style.display = "none";
        document.getElementById("content").style.display = "block";
        clearLoginInput();
    } else {
        clearLoginInput();
        document.getElementById("login_mask").style.display = "block";
        document.getElementById("headline").style.display = "block";
        document.getElementById("content").style.display = "none";
    }
}


//----------------------------------------------------------------------------------------------------------------- set Profile Data

async function setProfileName() {
    const name = localStorage.getItem("user");
    showLoader();
    try {
        const response = await fetch(`https://one860mindenplanner.onrender.com/account/getUserInfo?name=${name}`, {
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
    document.getElementById('safeBtn1').style.display = 'inline-block';
}

async function saveName() {
    const vorname = document.getElementById('editVorname').value || document.getElementById('editVorname').placeholder;
    const nachname = document.getElementById('editNachname').value || document.getElementById('editNachname').placeholder;
    const username = localStorage.getItem("user");

    document.getElementById('Vorname').textContent = vorname;
    document.getElementById('Nachname').textContent = nachname;

    document.getElementById('nameView').style.display = 'block';
    document.getElementById('nameEdit').style.display = 'none';
    document.getElementById('safeBtn2').style.display = 'none';
    showLoader();

    if (!username) {
        console.error("Kein Benutzername im LocalStorage gefunden.");
        return;
    }
    try {
        const response = await fetch("https://one860mindenplanner.onrender.com/account/changeData", {
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



function editPassword(){
    document.getElementById('nameView').style.display = 'none';
    document.getElementById('passwordEdit').style.display = 'block';
    document.getElementById('safeBtn2').style.display = 'inline-block';
}

async function updatePassword(username, newPassword) {
    if (!username || !newPassword) {
        alert("Bitte Benutzername und Passwort eingeben!");
        document.getElementById('passwordEdit').style.display = "none";
        return;
    }
    try {
        const response = await fetch('https://one860mindenplanner.onrender.com/account/updatePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: username,
                newPassword: newPassword
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Fehler beim Aktualisieren des Passworts");
        }
        alert("Passwort erfolgreich aktualisiert!");
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Passworts:", error);
        alert("Fehler: " + error.message);
    }
}



//----------------------------------------------------------------------------------------------------------------- User - Report

function createReport() {
    document.getElementById('reportTitle').value = "";
    document.getElementById('reportTxt').value = "";
    document.getElementById('createReport').style.display = "block";
    document.getElementById('loadingBackground').style.display="block";
}

function cancleReport() {
    document.getElementById('reportTitle').value = "";
    document.getElementById('reportTxt').value = "";
    document.getElementById('loadingBackground').style.display="none";
    document.getElementById('createReport').style.display = "none";
}

async function submitReport() {
    const reportTitle = document.getElementById('reportTitle').value.trim();
    const reportTxt = document.getElementById('reportTxt').value.trim();
    const username = localStorage.getItem("user");

    if (!username) {
        cancleReport();
        return;
    }
    if (!reportTitle || !reportTxt) {
        alert("Es muss sowohl ein Titel als auch eine Fehlerbeschreibung vergeben werden!");
        cancleReport();
        return;
    }
    const data = {
        username: username,
        reportTitle: reportTitle,
        report: reportTxt
    };
    showLoader();
    try {
        const response = await fetch('https://one860mindenplanner.onrender.com/report/issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        hideLoader();
        if (response.ok) {
            cancleReport();
        } else {
            alert(result.message || "Fehler beim Erstellen des Reports.");
        }
    } catch (error) {
        hideLoader();
        console.error("Fehler beim Senden des Reports:", error);
        alert("Es gab einen Fehler beim Senden des Reports.");
    }
}


//----------------------------------------------------------------------------------------------------------------- Admin - Report Handling


function goToAdminReportContainer(){
    document.getElementById('reportContainer').innerHTML=" ";
    loadAdminReports();
}
function goToAdminUserContainer(){
    document.getElementById('reportContainer').innerHTML=" ";
    loadAdminUsers();
}

async function loadAdminReports() {
    document.getElementById('AdminPage').style.display = "block";
    showLoader();

    try {
        const response = await fetch('https://one860mindenplanner.onrender.com/report/all');
        if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Reports');
        }

        const reports = await response.json();
        if (!Array.isArray(reports) || reports.length === 0) {
            console.warn("Keine Reports gefunden.");
            document.getElementById('reportContainer').innerHTML=" ";
            hideLoader();
            return;
        }

        let adminPage = document.getElementById('AdminPage');
        let existingContainer = document.getElementById('reportContainer');

        if (existingContainer) {
            existingContainer.remove();
        }

        let container = document.createElement('div');
        container.id = "reportContainer";
        container.className = "admin-report-container";

        reports.forEach(report => {
            let reportSection = document.createElement('div');
            reportSection.className = "report-section";

            let infoDiv = document.createElement('div');
            infoDiv.className = "report-info";
            infoDiv.innerHTML = `
                <span class="report-timestamp">${new Date(report.timestamp).toLocaleString()}</span>
                <span class="report-user">${report.username || "Unbekannt"}</span>
            `;

            let deleteButton = document.createElement('button');
            deleteButton.className = "delete-button";
            deleteButton.innerHTML = "🗑️";
            deleteButton.onclick = () => deleteReport(report.reportTitle);

            infoDiv.appendChild(deleteButton);
            let table = document.createElement('table');
            table.className = "report-table";

            table.innerHTML = `
                <tr>
                    <th>Titel</th>
                    <td>${report.reportTitle || "Kein Titel"}</td>
                </tr>
                <tr>
                    <th>Text</th>
                    <td>${report.report || "Kein Text"}</td>
                </tr>
            `;
            reportSection.appendChild(infoDiv);
            reportSection.appendChild(table);
            container.appendChild(reportSection);
        });

        let logoutButton = document.getElementById('AdminLogout');
        adminPage.insertBefore(container, logoutButton);

    } catch (error) {
        console.error("Fehler beim Laden der Reports:", error);
    }
    hideLoader();
}

async function deleteReport(reportTitle) {
    showLoader();
    try {
        const response = await fetch('https://one860mindenplanner.onrender.com/report/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reportTitle })
        });
        const result = await response.json();
        if (!response.ok) {
            alert(`Fehler: ${result.message}`);
            hideLoader();
            return;
        }
        hideLoader();
        loadAdminReports();
    } catch (error) {
        hideLoader();
        console.error("Fehler beim Löschen des Reports:", error);
        alert("Ein unerwarteter Fehler ist aufgetreten.");
    }
}


async function loadAdminUsers() {
    document.getElementById('AdminPage').style.display = "block";
    showLoader();

    try {
        const users = await getAllUser();
        if (!Array.isArray(users) || users.length === 0) {
            console.warn("Keine Benutzer gefunden.");
            document.getElementById('userContainer').innerHTML = "Keine Benutzer vorhanden.";
            hideLoader();
            return;
        }

        let adminPage = document.getElementById('AdminPage');
        let existingContainer = document.getElementById('userContainer');

        if (existingContainer) {
            existingContainer.remove();
        }

        let container = document.createElement('div');
        container.id = "userContainer";
        container.className = "admin-report-container";

        users.forEach(user => {
            let userSection = document.createElement('div');
            userSection.className = "report-section";

            let infoDiv = document.createElement('div');
            infoDiv.className = "report-info";
            infoDiv.innerHTML = `
                <span class="report-user">${user.firstName || "Unbekannt"}</span>
            `;

            let deleteButton = document.createElement('button');
            deleteButton.className = "delete-button";
            deleteButton.innerHTML = "🗑️";
            deleteButton.onclick = () => deleteAdminUser(user.firstName);

            infoDiv.appendChild(deleteButton);

            let table = document.createElement('table');
            table.className = "report-table";

            table.innerHTML = `
                <tr>
                    <th>Username</th>
                    <td>${user.firstName || "Kein Benutzername"}</td>
                </tr>
                <tr>
                    <th>Nachname</th>
                    <td>${user.lastName || "Kein Nachname"}</td>
                </tr>
            `;

            userSection.appendChild(infoDiv);
            userSection.appendChild(table);
            container.appendChild(userSection);
        });

        let logoutButton = document.getElementById('AdminLogout');
        adminPage.insertBefore(container, logoutButton);

    } catch (error) {
        console.error("Fehler beim Laden der Benutzer:", error);
    }
    hideLoader();
}



async function deleteAdminUser(username) {
    const name = username;
    showLoader();
    try {
        const response = await fetch("https://one860mindenplanner.onrender.com/account/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({name})
        });
        if (!response.ok) {
            throw new Error(`Account löschen fehlgeschlagen: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        hideLoader();
        alert("Der Account '"+ username+ "' wurde gelöscht!");
        goToAdminUserContainer();
    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Fehler beim Löschen des Accounts!";
    }
}


//----------------------------------------------------------------------------------------------------------------- get User List

async function getAllUser() {
    showLoader();
    try {
        const response = await fetch(`https://one860mindenplanner.onrender.com/users/getUsers`, {
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
            <img src="frontend/assets/images/system/profile_icon.png" alt="profile icon">
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

//globale field for current status
let currentExercise = [];
let currentDevice = null;


//----------------------------------------------------------------------------------------------------------------- request exercise of a user

async function requestUserExercise(username, device) {
    currentExercise = [];
    showLoader();
    try {
        if (!username || !device) throw new Error("Exercise request failed: Invalid params");
        const response = await fetch(`https://one860mindenplanner.onrender.com/exercise/get?device=${device}&vorname=${username}`);
        
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


//----------------------------------------------------------------------------------------------------------------- get all Routines of a user

async function getAllUserExercise(username) {
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


//----------------------------------------------------------------------------------------------------------------- load Routine of User and validate it

async function showMemberData(username) {
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
            let elements = [];

            for (let i = 0; i < exercises.elemente.length; i++) {
                let element = exercises.elemente[i];
                if (!element) continue;
                
                element = await getElementDetails(element);
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
            let { warnings, errors, totalDifficulty, totalElements, groupList, isComplete } = validRoutine(elements, device);

            // ⚠️ Fehler und Warnungen
            let summary = document.createElement("div");
            summary.className = "exercise-summary";
            summary.innerHTML = `
                ${warnings.length > 0 ? `<p style="color: orange;"><strong>⚠️ Warnungen:</strong> ${warnings.join(" | ")}</p>` : ""}
                <p><strong>Gesamtanzahl der Elemente:</strong> ${totalElements}</p>
                <p><strong>Gesamte Schwierigkeit:</strong> ${totalDifficulty.toFixed(2)}</p>
                <p><strong>Elementgruppen:</strong> ${groupList || "Keine"}</p>
                <p><strong>Übung vollständig:</strong> 
                    <span style="color: ${isComplete ? "green" : "red"}; font-weight: bold;">
                        ${isComplete ? "✅ Ja" : "❌ Nein"}
                    </span>
                </p>
                ${errors.length > 0 ? `<p style="color:red;"><strong>Fehler:</strong> ${errors.join(" | ")}</p>` : ""}
            `;
            exerciseDiv.appendChild(summary);
        } else {
            exerciseDiv.innerHTML = `<p>Keine Übungen gefunden</p>`;
        }

        exerciseContainer.appendChild(deviceButton);
        exerciseContainer.appendChild(exerciseDiv);
    }
}


//----------------------------------------------------------------------------------------------------------------- validate Routine

function validRoutine(elements, device) {
    console.log("check if the Routine is valid: ", device, "; ", elements);

    const requiredGroups = {
        "FL": new Set(["1", "2", "3"]), 
        "PO": new Set(["1", "2", "3", "4"]), 
        "RI": new Set(["1", "2", "3", "4"]), 
        "VA": new Set([]), 
        "PA": new Set(["1", "2", "3", "4"]), 
        "HI": new Set(["1", "2", "3", "4"]) 
    };

    let totalDifficulty = 0;
    let elementGroups = new Map();
    let hasDismount = false;
    let seenElements = new Map();
    let warnings = [];
    let errors = [];

    let isDismountAtEnd = false;

    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];

        totalDifficulty += parseFloat(element.wertigkeit) || 0;

        if (element.elementegruppe) {
            elementGroups.set(element.elementegruppe, (elementGroups.get(element.elementegruppe) || 0) + 1);
        }

        if (element.dismount) {
            hasDismount = true;
            if (i === elements.length - 1) {
                isDismountAtEnd = true;
            }
        }
        if (element.bezeichnung) {
            seenElements.set(element.bezeichnung, (seenElements.get(element.bezeichnung) || 0) + 1);
        }
    }

    let requiredGroupSet = requiredGroups[device] || new Set();
    let missingGroups = [...requiredGroupSet].filter(group => !elementGroups.has(group));

    let totalElements = elements.length;
    let groupList = [...elementGroups.keys()].sort().join(", ");
    let isComplete = missingGroups.length === 0 && hasDismount && totalElements >= 7 && isDismountAtEnd;

    // WARNUNGEN:
    if (totalElements > 7) {
        warnings.push("⚠️ Übung enthält mehr als 7 Elemente");
    }
    for (let [group, count] of elementGroups.entries()) {
        if (count > 3) {
            warnings.push(`⚠️ Elementgruppe ${group} kommt sehr oft vor (${count}x).`);
        }
    }
    let duplicateElements = [...seenElements.entries()]
        .filter(([_, count]) => count > 1)
        .map(([name, count]) => `${name} (${count}x)`);
    if (duplicateElements.length > 0) {
        warnings.push(`⚠️ Doppelte Elemente: ${duplicateElements.join(", ")}`);
    }

    // Fehlererkennung
    if (device === "PO" && totalElements === 0) {
        errors.push("❌ Keine Elemente im Sprung.");
    }

    if (totalElements < 7) {
        errors.push(`❌ Zu wenig Elemente: ${totalElements}`);
    }
    if (missingGroups.length > 0) {
        errors.push(`❌ Fehlende Gruppen: ${missingGroups.join(", ")}`);
    }
    if (!hasDismount) {
        errors.push("❌ Kein Abgang vorhanden");
    }
    if (!isDismountAtEnd) {
        errors.push("❌ Der Abgang muss am Ende der Übung sein.");
    }
    return { warnings, errors, totalDifficulty, totalElements, groupList, isComplete };
}


//----------------------------------------------------------------------------------------------------------------- Handle Devices (open/close)

function toggleExercise(device) {
    let exerciseDiv = document.getElementById(`exercise-${device}`);
    exerciseDiv.style.display = exerciseDiv.style.display === "none" ? "block" : "none";
}

function hideMemberExerciseList() {
    let memberExerciseList = document.getElementById('memberExerciseList');
    memberExerciseList.style.display = "none";
    memberExerciseList.innerHTML = "";
}


//----------------------------------------------------------------------------------------------------------------- Handle back-Btn

let pageDepth = 0;


//----------------------------------------------------------------------------------------------------------------- Open Device (info-setter)

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


//----------------------------------------------------------------------------------------------------------------- toggle Visibility

function toggleUIElementVisibility(elements, displayValue) {
    elements.forEach(element => {
        document.getElementById(element).style.display = displayValue;
    });
}


//----------------------------------------------------------------------------------------------------------------- Handle Routine Panel

function createRoutine() {
    pageDepth = 1;
    toggleUIElementVisibility(
        ['infoBlock', 'createRoutineBtn', 'elementSelection', 'detailedElementInfo'],
        'none'
    );
    document.getElementById('exerciseCreationPanel').style.display = 'block';
    document.getElementById("selected-exercises-list").innerHTML = "";
    loadCurrentExercise(localStorage.getItem("user"), currentDevice);
}

function closeDevice() {
    if(pageDepth == 2){
        document.getElementById('elementSelection').style.display="none";
        document.getElementById('detailedElementInfo').style.display="none";
        document.getElementById('add-exercise-btn').style.display="block";
        document.getElementById('selected-exercises-list').style.display="flex";
        loadCurrentExercise(localStorage.getItem("user"), currentDevice);
    }
    else if(pageDepth == 1){
        document.getElementById('exerciseCreationPanel').style.display="none";
        document.getElementById('infoBlock').style.display="block";
        document.getElementById('createRoutineBtn').style.display="block";
    }
    else if(pageDepth == 0){
        document.getElementById('EquipmentExercise').style.display="none";
    } else {
        togglePanel(1);
    }
    pageDepth-=1;
}


//----------------------------------------------------------------------------------------------------------------- Load safed Exercise

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

    let summaryContainer = document.createElement("div");
    summaryContainer.id = "exercise-summary-container";
    exerciseContainer.appendChild(summaryContainer);
    updateExerciseSummary();
    makeTableDraggable();
}


//----------------------------------------------------------------------------------------------------------------- Create Table

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


//----------------------------------------------------------------------------------------------------------------- remove Element from routine

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
    updateExerciseSummary();
}


//----------------------------------------------------------------------------------------------------------------- add Element to Routine

function addToExercise(element) {
    document.getElementById('detailedElementInfo').style.display="none";
    currentExercise.push(element.id);
    safeUpdateExercise(currentExercise);
}


//----------------------------------------------------------------------------------------------------------------- enable dragAndDrop

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


//----------------------------------------------------------------------------------------------------------------- change Routine Order

function updateExerciseOrder() {
    let newOrder = [];
    document.querySelectorAll("#exerciseTbody tr").forEach((row, index) => {
        row.querySelector("td:first-child").innerText = index + 1;
        newOrder.push(row.getAttribute("data-index"));
    });
    
    let tempList = [];
    newOrder.forEach(elementIndex => {
        if (currentExercise.length >= elementIndex && currentExercise.at(elementIndex)) {
            tempList.push(currentExercise.at(elementIndex));
        }
    });
    currentExercise = tempList;
    console.log("Übung nach der neuen Reihenfolge: ", currentExercise);

    safeUpdateExercise(currentExercise);
    updateExerciseSummary();
}



//----------------------------------------------------------------------------------------------------------------- Update Routine Summary

async function updateExerciseSummary() {
    let elementDetailsList = await Promise.all(
        currentExercise.map(el => getElementDetails(el))
    );

    let device = "FL";
    let { warnings, errors, totalDifficulty, totalElements, groupList, isComplete } = validRoutine(elementDetailsList, device);

    let summaryContainer = document.getElementById("exercise-summary-container");
    if (!summaryContainer) return;

    summaryContainer.innerHTML = `
        ${warnings.length > 0 ? `<p style="color: orange;"><strong>⚠️ Warnungen:</strong> ${warnings.join(" | ")}</p>` : ""}
        <p><strong>Gesamtanzahl der Elemente:</strong> ${totalElements}</p>
        <p><strong>Gesamte Schwierigkeit:</strong> ${totalDifficulty.toFixed(2)}</p>
        <p><strong>Elementgruppen:</strong> ${groupList || "Keine"}</p>
        <p><strong>Übung vollständig:</strong> 
            <span style="color: ${isComplete ? "green" : "red"}; font-weight: bold;">
                ${isComplete ? "✅ Ja" : "❌ Nein"}
            </span>
        </p>
        ${errors.length > 0 ? `<p style="color:red;"><strong>Fehler:</strong> ${errors.join(" | ")}</p>` : ""}
    `;
}


//----------------------------------------------------------------------------------------------------------------- show Element selection

function selectElement() {
    pageDepth = 2;
    document.getElementById('elementSelection').style.display = "block";
    document.getElementById('add-exercise-btn').style.display = "none";  
    document.getElementById('allElemBtn').style.border = "solid 2px black";
    getElements(null, null);
}

let activeFilter_difficulty = null;
let activeFilter_group = null;

function getFilteredElementList(difficulty, group) {
    let pDifficulty = (difficulty !== null) ? difficulty : activeFilter_difficulty;
    let pGroup = (group !== null) ? group : activeFilter_group;

    if (pDifficulty !== activeFilter_difficulty || pGroup !== activeFilter_group) {
        activeFilter_difficulty = pDifficulty;
        activeFilter_group = pGroup;

        getElements(pDifficulty, pGroup);
    }
}

function openFilter() {
    const filterDiv1 = document.getElementById('filterDifficulty');
    const filterDiv2 = document.getElementById('filterGroup');
    const buttons1 = filterDiv1.querySelectorAll('button');
    const buttons2 = filterDiv2.querySelectorAll('button');

    buttons1.forEach((button, index) => {
        button.style.backgroundColor="#444";
    });
    buttons2.forEach((button, index) => {
        button.style.backgroundColor="#444";
    });
    document.getElementById("filterWrapper").classList.add("show");
    activeFilter_difficulty = null;
    activeFilter_group = null;
}

function closeFilter() {
    document.getElementById("filterWrapper").classList.remove("show");
}

function filterByDifficulty(difficulty, pressedBtn) {
    const filterDifficulty = document.getElementById('filterDifficulty');
    const buttons = filterGroup.querySelectorAll('button');

    buttons.forEach((button, index) => {
        button.style.backgroundColor="#444";
    });
    pressedBtn.style.backgroundColor="#777777";
    getFilteredElementList(difficulty, activeFilter_group);
}

function filterByGroup(group, pressedBtn) {
    const filterGroup = document.getElementById('filterGroup');
    const buttons = filterGroup.querySelectorAll('button');

    buttons.forEach((button, index) => {
        button.style.backgroundColor="#444";
    });
    pressedBtn.style.backgroundColor="#777777";
    getFilteredElementList(activeFilter_difficulty, group);
}



//----------------------------------------------------------------------------------------------------------------- get filtered Elements

async function getElements(difficulty, group) {
    const leftBlock = document.getElementById('leftColumn');
    const rightBlock = document.getElementById('rightColumn');
    leftBlock.innerHTML = "";
    rightBlock.innerHTML = "";
    document.getElementById('selected-exercises-list').style.display="none";
    let togglePage = true;

    let device = currentDevice;
    showLoader();
    try {
        const url = new URL('https://one860mindenplanner.onrender.com/elements/getGroupElements');
        const params = { Device: device, Difficulty: difficulty , Group: group};
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


//----------------------------------------------------------------------------------------------------------------- Handle Detailed element view

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

function closeDetailedView() {
    document.getElementById('detailedElementInfo').style.display = "none";
}

async function getElementDetails(elementId) {
    showLoader();
    try {
        const deviceCode = elementId.substring(0, 2);
        const response = await fetch(`https://one860mindenplanner.onrender.com/exercise/get_element?id=${elementId}&currentDevice=${deviceCode}`);
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


//----------------------------------------------------------------------------------------------------------------- safe Routine

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
        const response = await fetch("https://one860mindenplanner.onrender.com/exercise/update", {
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