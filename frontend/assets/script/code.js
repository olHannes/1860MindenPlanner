
let serverURL = "https://one860mindenplanner.onrender.com";
serverURL = "http://127.0.0.1:10000";

window.onload = function () {
    try {
        fetch(`${serverURL}/awake`)
    } catch (error) {}
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("adminKey");
    if(localStorage.getItem("startUpInfo") != null) {
        document.getElementById("startupInformation").style.display="none";
    }
    checkUserStatus();
};

//----------------------------------------------------------------------------------------------------------------- show Notification
function showMessage(title, content) {
    const box = document.getElementById('MessageBox');
    const titleEl = document.getElementById('messageBoxTitle');
    const contentEl = document.getElementById('messageBoxContent');

    titleEl.textContent = title;
    contentEl.textContent = content;
    box.classList.add('show');

    const hideBox = () => {
        box.classList.remove('show');
        box.removeEventListener('click', hideBox);
    };
    box.addEventListener('click', hideBox);
    setTimeout(() => {
        hideBox();
    }, 2000);
}

//----------------------------------------------------------------------------------------------------------------- hide info
document.addEventListener("DOMContentLoaded", function() {
    loadMaxPoints();
    document.getElementById("closeInfoBox").addEventListener("click", function() {
        document.getElementById("startupInformation").style.display = "none";
        localStorage.setItem("startUpInfo", true);
    });

    document.getElementById("closeNews").addEventListener("click", function() {
        document.getElementById("news").style.display = "none";
    });

    document.getElementById("filterLearnedElements").addEventListener("change", function () {
        activeFilter_learnedElem = this.checked;
        getFilteredElementList();
      });
});

function openNews() {
    document.getElementById("news").style.display = "block";
}


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


//----------------------------------------------------------------------------------------------------------------- Page Handling
let activePanel = null;

// Open / Close
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

// Reset
function resetPanel(panelId) {
    switch (parseInt(panelId, 10)) {
        case 0:
            document.getElementById('nameEdit').style.display="none";
            document.getElementById('passwordEdit').style.display="none";
            document.getElementById('requestDelAcc').style.display="none";
            document.getElementById('nameView').style.display = 'block';
            break;
        case 1:
            document.getElementById('elementSelection').style.display="none";
            document.getElementById('exerciseCreationPanel').style.display="none";
            document.getElementById('EquipmentExercise').style.display="none";
            document.getElementById('exerciseCreationButtonPanel').style.display = "flex";  

            break;
        case 2:
            document.getElementById('memberExerciseList').style.display="none";
            document.getElementById('memberExerciseList').innerHTML="";
            break;
        default:
            console.log("Unbekanntes Panel");
            break;
    }
}

// Download Panel
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



//----------------------------------------------------------------------------------------------------------------- Registration Handling

// registration window
function toggleRegistration() {
    document.getElementById("login_mask").style.display = "none";
    document.getElementById("registration_mask").style.display = "block";
    clearLoginInput();
}

// cancle registration
function cancelRegistration() {
    document.getElementById("login_mask").style.display = "block";
    document.getElementById("registration_mask").style.display = "none";
    clearLoginInput();
}

// register new User
async function register() {
    firstName = document.getElementById("firstName").value;
    lastName = document.getElementById("lastName").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    firstName = normalizeName(firstName);
    lastName = normalizeName(lastName);

    if (newPassword !== confirmPassword) {
        document.getElementById("errorMsgRegister").textContent = "Passwörter stimmen nicht überein!";
        return;
    }

    if (firstName.trim() === "" || lastName.trim() === "" || newPassword.trim() === "" || confirmPassword.trim() === "") {
        document.getElementById("errorMsgRegister").textContent = "Alle Felder müssen ausgefüllt sein!";
        return;
    }
    
    const namePattern = /^[A-Za-zÄÖÜäöüß ]+$/;
    if (!namePattern.test(firstName)) {
        document.getElementById("errorMsgRegister").textContent = "Der Vorname darf nur Buchstaben enthalten!";
        return;
    }
    
    if (!namePattern.test(lastName)) {
        document.getElementById("errorMsgRegister").textContent = "Der Nachname darf nur Buchstaben enthalten!";
        return;
    }
    
    try {
        showLoader();
        const response = await fetch(`${serverURL}/account/register`, {
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



//----------------------------------------------------------------------------------------------------------------- Login Handling

// login User
async function login() {
    let username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    username = normalizeName(username);

    console.log("login: ", username, " ");
    showLoader();
    try {
        const response = await fetch(`${serverURL}/account/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        hideLoader();

        if(response.ok && username == "Admin"){
            localStorage.setItem("user", username);
            localStorage.setItem("userId", data.userId);
            localStorage.setItem("adminKey", data.adminKey);
            loadAdminReports();
            return;
        }

        if (response.ok && data.message === "Login erfolgreich!") {
            localStorage.setItem("user", username);
            localStorage.setItem("userId", data.userId);
            setProfileName();
            checkLoginStatus();
            loadMaxPoints();
        } else if (response.status === 403) {
            document.getElementById("errorMsg").textContent = "Benutzer bereits auf einem anderen Gerät eingeloggt!";
        } else {
            document.getElementById("errorMsg").textContent = "Ungültiger Benutzername oder Passwort!";
        }
    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Ein unerwarteter Fehler ist aufgetreten!";
        showNameError();
    }
}

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

        if (data.message === "Benutzer offline, Status zurückgesetzt!") {
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            localStorage.removeItem("adminKey");
        }

    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        showNameError();
    }
}

function showNameError(){
    document.getElementById('loginError').style.display="block";
    document.getElementById('loadingBackground').style.display="block";
}

function hideNameError(){
    location.reload();
}

// clear Login / Registration Inputs
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

// toggle panel view after login
function checkLoginStatus() {
    const user = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");
    if (user && userId) {
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

// initialize profile config
async function setProfileName() {
    const userId = localStorage.getItem("userId");
    showLoader();
    if(!userId){
        console.error("Keine userId gefunden.");
        hideLoader();
        checkLoginStatus();
        return;
    }

    try {
        const response = await fetch(`${serverURL}/account/getUserInfo?userId=${userId}`, {
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

        const profileImg = document.getElementById('profilePicture');
        const profileImg_2 = document.getElementById('profilePictureOptions');
        if (profileImg && profileImg_2 && userInfo.color_code && userInfo.color_code !== "#000000") {
            profileImg.style.filter = `drop-shadow(0px 0px 5px ${userInfo.color_code})`;
            profileImg_2.style.filter = `drop-shadow(0px 0px 5px ${userInfo.color_code})`;
        } else if (profileImg && profileImg_2) {
            profileImg.style.filter = "";
            profileImg_2.style.filter = "";
        }

        hideLoader();
    } catch (error) {
        hideLoader();
        localStorage.removeItem("userId");
        localStorage.removeItem("adminKey");
        checkLoginStatus();
        console.error("Error:", error);
    }
}


//----------------------------------------------------------------------------------------------------------------- Logout Handling

// User Logout
async function logout() {
    const username = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");
    if (!username || !userId) {
        document.getElementById("errorMsg").textContent = "Kein Benutzer eingeloggt!";
    }

    showLoader();
    try {
        const response = await fetch(`${serverURL}/account/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username, userId })
        });

        const data = await response.json();
        hideLoader();
        if (response.ok && (data.message === "Erfolgreich ausgeloggt!" || data.message === "Kein Benutzername oder Benutzer-ID angegeben!")) {
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            localStorage.removeItem("adminKey");
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
    checkLoginStatus();
}

// Auto Logout
window.onbeforeunload = async function () {
    const username = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");

    if (!username || !userId) return;

    showLoader();
    try {
        const response = await fetch(`${serverURL}/account/logout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username, userId })
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Logout: ${response.status} ${response.statusText}`);
        }
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("adminKey");
        hideLoader();
    } catch (error) {
        hideLoader();
        console.error("Error beim Verlassen der Seite:", error);
    }
};


//----------------------------------------------------------------------------------------------------------------- Delete-Account Handling
// secure Window
function requestDeleteAcc(){
    document.getElementById('requestDelAcc').style.display="block";
    document.getElementById('loadingBackground').style.display="block";
}

// cancle
function cancelDeleteAcc(){
    document.getElementById('requestDelAcc').style.display="none";
    document.getElementById('loadingBackground').style.display="none";
}

// Delete Account
async function deleteAccount() {
    const name = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");

    if (!name || !userId) {
        document.getElementById("errorMsg").textContent = "Benutzer nicht gefunden!";
        return;
    }
    showLoader();
    try {
        const response = await fetch(`${serverURL}/account/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({name, userId})
        });

        if (!response.ok) {
            throw new Error(`Account löschen fehlgeschlagen: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        hideLoader();
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("adminKey");
        checkLoginStatus();

        showMessage("Account gelöscht", "Der Account '" + name + "' wurde erfolgreich gelöscht!");
        document.getElementById('requestDelAcc').style.display="none";

    } catch (error) {
        hideLoader();
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Fehler beim Löschen des Accounts!";
    }
}



//----------------------------------------------------------------------------------------------------------------- Account Edit

// name Edit
function editName() {
    const vorname = document.getElementById('Vorname').textContent;
    const nachname = document.getElementById('Nachname').textContent;

    document.getElementById('editVorname').placeholder = vorname;
    document.getElementById('editNachname').placeholder = nachname;

    document.getElementById('editVorname').value = '';
    document.getElementById('editNachname').value = '';

    document.getElementById('nameEdit').style.display = 'block';
    document.getElementById('safeBtn1').style.display = 'inline-block';
    document.getElementById('cancleBtn1').style.display = 'inline-block';
}

function normalizeName(name) {
    return name
        .trim()              
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// safe Name-Edit
async function saveName() {
    vorname = document.getElementById('editVorname').value || document.getElementById('editVorname').placeholder;
    nachname = document.getElementById('editNachname').value || document.getElementById('editNachname').placeholder;
    const userId = localStorage.getItem("userId");

    vorname = normalizeName(vorname);
    nachname = normalizeName(nachname);

    document.getElementById('Vorname').textContent = vorname;
    document.getElementById('Nachname').textContent = nachname;

    document.getElementById('nameView').style.display = 'block';
    document.getElementById('nameEdit').style.display = 'none';
    document.getElementById('safeBtn2').style.display = 'none';
    showLoader();

    if (!userId) {
        console.error("Keine Benutzer-ID im LocalStorage gefunden.");
        return;
    }
    try {
        const response = await fetch(`${serverURL}/account/changeData`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                new_first_name: vorname,
                new_last_name: nachname
            })
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Data-change: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        localStorage.setItem("user", vorname);
        showMessage("Name erfolgreich geändert", "Der neue Name wurde erfolgreich in der Datenbank gespeichert.");
        hideLoader();

    } catch (error) {
        hideLoader();
        console.error("Fehler beim Speichern der Benutzerdaten:", error);
    }
}


// password edit
function editPassword(){
    document.getElementById('passwordEdit').style.display = 'block';
    document.getElementById('editPassword_1').value = "";
    document.getElementById('safeBtn2').style.display = 'inline-block';
    document.getElementById('cancleBtn2').style.display = 'inline-block';
}

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


async function updateAdminPassword(username, newPassword){
    adminKey = localStorage.getItem("adminKey");
    if (!username || !newPassword || !adminKey) {
        document.getElementById('passwordEdit').style.display = "none";
        document.getElementById('nameView').style.display = "block";
        return;
    }
    try {
        const response = await fetch(`${serverURL}/account/admin/updatePassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                newPassword: newPassword,
                adminKey: adminKey
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Fehler beim Aktualisieren des Passworts");
        }
        showMessage("Passwort erfolgreich geändert", "Die Passwortänderung wurde erfolgreich durchgeführt.");
    } catch (error) {
        alert("Fehler: " + error.message);
    }
    document.getElementById('passwordEdit').style.display = "none";
    document.getElementById('nameView').style.display = "block";   
}

// color-Editing Container handling
function toggleOptionsContainer(){
    if(document.getElementById('accountOptionsWrapper').style.display=="block"){
        hideOptionsContainer();
    } else {
        displayOptionsContainer();
    }
}

function displayOptionsContainer(){
    document.getElementById('passwordEdit').style.display="none";
    document.getElementById('nameEdit').style.display="none";
    document.getElementById('accountOptionsWrapper').style.display="block";
}

function hideOptionsContainer(){
    document.getElementById('accountOptionsWrapper').style.display="none";
}

// update User-Color
async function changeUserColor(color) {
    showLoader();

    const userId = localStorage.getItem("userId");
    if (!userId || !color) {
        console.error("Fehlende Parameter: Benutzer-ID oder Farbe");
        hideLoader();
        return;
    }

    try {
        const response = await fetch(`${serverURL}/account/user/colorChange`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: userId,
                colorCode: color
            })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Fehler: ${response.status}`);
        }
        showMessage("Erfolgreiche Farbänderung", "Die Nutzer-Farbe wurde erfolgreich geändert.");
        const profileImg = document.getElementById('profilePicture');
        const profileImg_2 = document.getElementById('profilePictureOptions');

        if (profileImg && profileImg_2 && color !== "#000000") {
            profileImg.style.filter = `drop-shadow(0px 0px 5px ${color})`;
            profileImg_2.style.filter = `drop-shadow(0px 0px 5px ${color})`;
        } else if (profileImg && profileImg_2) {
            profileImg.style.filter = "";
            profileImg_2.style.filter = "";
        }
    } catch (error) {
        console.error("Fehler beim Ändern der Farbe:", error);
    }
    hideLoader();
}



//----------------------------------------------------------------------------------------------------------------- Report Handling <User>

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
        showMessage("Fehlende Eingaben", "Ein Report muss mindestens einen Titel und eine Beschreibung haben!");
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
        const response = await fetch(`${serverURL}/report/issue`, {
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
            showMessage("Report erstellt", "Es wurde ein neuer Report erfolgreich angelegt.");
        } else {
            showMessage("Fehlerhafte Reporterstellung", "Der Report konnte nicht erfolgreich erstellt werden!");
        }
    } catch (error) {
        hideLoader();
        showMessage("Fehlerhafte Reporterstellung", "Der Report konnte nicht erfolgreich gesendet werden!");
    }
}


//----------------------------------------------------------------------------------------------------------------- Report Handling <Admin>

function goToAdminReportContainer(){
    emptyAdminContainer();
    loadAdminReports();
}

async function loadAdminReports() {
    document.getElementById('AdminPage').style.display = "block";
    showLoader();

    try {
        const response = await fetch(`${serverURL}/report/all`);
        if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Reports');
        }

        const reports = await response.json();
        let adminPage = document.getElementById('AdminPage');
        let existingContainer = document.getElementById('reportContainer');

        if (existingContainer) {
            existingContainer.remove();
        }

        let container = document.createElement('div');
        container.id = "reportContainer";
        container.className = "admin-report-container";

        if (!Array.isArray(reports) || reports.length === 0) {
            console.warn("Keine Reports gefunden.");

            let emptyMessage = document.createElement('p');
            emptyMessage.innerText = "Keine Reports vorhanden.";

            container.appendChild(emptyMessage);
        } else {
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
        }

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
        const response = await fetch(`${serverURL}/report/delete`, {
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



//----------------------------------------------------------------------------------------------------------------- User Handling <Admin>

function goToAdminUserContainer(){
    emptyAdminContainer();
    loadAdminUsers();
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
            userSection.onclick = () => changeUserAdminPwd(user.firstName);

            let infoDiv = document.createElement('div');
            infoDiv.className = "report-info";
            infoDiv.innerHTML = `
                <span class="report-user">${user.firstName || "Unbekannt"}</span>
            `;

            let deleteButton = document.createElement('button');
            deleteButton.className = "delete-button";
            deleteButton.innerHTML = "🗑️";
            deleteButton.onclick = (event) => {
                event.stopPropagation();
                deleteAdminUser(user.firstName);
            };

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
        const response = await fetch(`${serverURL}/account/delete`, {
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

function changeUserAdminPwd(username){
    document.getElementById('adminPwdChange_name').innerText=username;
    openPwdChange();
}

function openPwdChange() {
    document.getElementById('adminPwdChange_pwd').value="";
    document.getElementById("adminPwdChangeWrapper").classList.add("show");
}

function closePwdChange() {
    document.getElementById("adminPwdChangeWrapper").classList.remove("show");
}


//----------------------------------------------------------------------------------------------------------------- Competition Handling <Admin>

function goToAdminCompetitionContainer(){
    emptyAdminContainer();
    loadCompetitions();
}

async function loadCompetitions() {
    document.getElementById('AdminPage').style.display = "block";
    showLoader();

    try {
        const response = await fetch(`${serverURL}/competition/getAll`);
        if (!response.ok) throw new Error('Fehler beim Abrufen der Wettkämpfe');

        const competitions = await response.json();
        const adminPage = document.getElementById('AdminPage');

        const existingContainer = document.getElementById('competitionContainer');
        if (existingContainer) existingContainer.remove();

        const container = document.createElement('div');
        container.id = "competitionContainer";
        container.className = "admin-competition-container";

        const createButton = document.createElement('button');
        createButton.innerText = "➕ Wettkampf erstellen";
        createButton.id = "createCompBtn";
        createButton.addEventListener("click", openCompetitionWindow);
        container.appendChild(createButton);

        if (!Array.isArray(competitions) || competitions.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.innerText = "Keine Wettkämpfe vorhanden.";
            container.appendChild(emptyMessage);
        } else {
            competitions.forEach(competition => {
                const compCard = document.createElement('div');
                compCard.className = "competition-card";

                const header = document.createElement('div');
                header.className = "competition-card-header";

                const title = document.createElement('h2');
                title.innerText = competition.name;

                const date = document.createElement('p');
                date.innerHTML = `<strong>Datum:</strong> ${new Date(competition.date).toLocaleDateString()}`;

                const location = document.createElement('p');
                location.innerHTML = `<strong>Ort:</strong> ${competition.location}`;

                const deleteCompButton = document.createElement('button');
                deleteCompButton.className = "delete-button";
                deleteCompButton.innerText = "❌ Wettkampf löschen";
                deleteCompButton.addEventListener("click", () => {
                    deleteCompetition(competition._id);
                });

                header.appendChild(title);
                header.appendChild(date);
                header.appendChild(location);
                header.appendChild(deleteCompButton);
                compCard.appendChild(header);

                const participantList = document.createElement('div');
                participantList.className = "participant-list";

                if (competition.participants && competition.participants.length > 0) {
                    competition.participants.forEach(participant => {
                        const partCard = document.createElement('div');
                        partCard.className = "participant-card";

                        const name = document.createElement('p');
                        name.innerHTML = `<strong>Name:</strong> ${participant.name}`;

                        const deviceList = document.createElement('ul');
                        if (participant.devices && participant.devices.length > 0) {
                            participant.devices.forEach(device => {
                                const deviceItem = document.createElement('li');
                                deviceItem.innerText = `${device.name}: ${device.points} Pkt`;
                                deviceList.appendChild(deviceItem);
                            });
                        } else {
                            const noPoints = document.createElement('p');
                            noPoints.innerText = "Keine Punkte erfasst";
                            partCard.appendChild(noPoints);
                        }

                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = "delete-button";
                        deleteBtn.innerText = "❌ Teilnehmer löschen";
                        deleteBtn.addEventListener("click", () => {
                            deleteParticipant(competition._id, participant.id);
                        });

                        partCard.appendChild(name);
                        partCard.appendChild(deviceList);
                        partCard.appendChild(deleteBtn);
                        participantList.appendChild(partCard);
                    });
                } else {
                    const noParticipants = document.createElement('p');
                    noParticipants.innerText = "Keine Teilnehmer vorhanden.";
                    participantList.appendChild(noParticipants);
                }

                compCard.appendChild(participantList);
                container.appendChild(compCard);
            });
        }

        const logoutButton = document.getElementById('AdminLogout');
        adminPage.insertBefore(container, logoutButton);

    } catch (error) {
        console.error("Fehler beim Laden der Wettkämpfe:", error);
    }
    hideLoader();
}


async function deleteCompetition(competitionId) {
    if (!confirm("Wettkampf wirklich löschen?")) return;
    try {
        const response = await fetch(`${serverURL}/competition/delete/${competitionId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error("Löschen fehlgeschlagen.");
        }
        alert("Wettkampf erfolgreich gelöscht.");
        loadCompetitions();
    } catch (error) {
        console.error("Fehler beim Löschen des Wettkampfs:", error);
    }
}

async function deleteParticipant(competitionId, participantId) {
    if (!confirm("Teilnehmer wirklich aus dem Wettkampf entfernen?")) return;

    try {
        const response = await fetch(`${serverURL}/competition/${competitionId}/removeParticipant/${participantId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error("Löschen fehlgeschlagen.");
        }
        alert("Teilnehmer erfolgreich entfernt.");
        loadCompetitions();
    } catch (error) {
        console.error("Fehler beim Entfernen des Teilnehmers:", error);
    }
}

function openCompetitionWindow(){
    document.getElementById('compName').value = "";
    document.getElementById('compDate').value = null;
    document.getElementById('compLocation').value = "";
    document.getElementById('compCreationPanel').style.display="block";
}

function closeCompCreation() {
    document.getElementById('compCreationPanel').style.display="none";
    document.getElementById('compName').value = "";
    document.getElementById('compDate').value = null;
    document.getElementById('compLocation').value = "";
}

async function createCompetition() {
    let name = document.getElementById('compName').value;
    let date = document.getElementById('compDate').value;
    let location = document.getElementById('compLocation').value;

    if (!name || !date || !location) {
        alert("Bitte alle Felder ausfüllen: Name, Datum, Ort.");
        return;
    }

    const payload = {
        name: name,
        date: date,
        location: location
    };

    try {
        const response = await fetch(`${serverURL}/competition/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || "Wettkampf erfolgreich erstellt!");
            if (typeof loadCompetitions === 'function') {
                closeCompCreation();
                loadCompetitions();
            }
        } else {
            alert("Fehler: " + (result.message || "Wettkampf konnte nicht erstellt werden."));
        }
    } catch (error) {
        console.error("Fehler beim Erstellen des Wettkampfs:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    }
}


function emptyAdminContainer(){
    if(document.getElementById('reportContainer')!=null){
        document.getElementById('reportContainer').remove();
    }
    if(document.getElementById('userContainer')!=null){
        document.getElementById('userContainer').remove();
    }
    if(document.getElementById('competitionContainer')!=null){
        document.getElementById('competitionContainer').remove();
    }
}


//----------------------------------------------------------------------------------------------------------------- get User List

async function getAllUser() {
    showLoader();
    try {
        const response = await fetch(`${serverURL}/users/getUsers`, {
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
    document.getElementById('dashboard').style.display="none";
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';
    memberList.style.display="block";

    showLoader();
    const data = await getAllUser();
    data.sort((a, b) => a.lastName.localeCompare(b.lastName));
    data.forEach(user => {
        if (user.firstName === "admin" || user.firstName === "Admin") return; 
        const memberDiv = document.createElement('div');
        memberDiv.classList.add('member');
        memberDiv.onclick = () => showMemberData(user.firstName);

        const profileImg = document.createElement('img');
        profileImg.src = "frontend/assets/images/system/profile_icon.png";
        profileImg.alt = "profile icon";
        profileImg.style.filter = `drop-shadow(0px 0px 5px ${user.color_code})`;

        memberDiv.appendChild(profileImg);
        memberDiv.innerHTML += `
            <span class="name-de">${user.firstName}</span>
            <span class="name-en">${user.lastName}</span>
        `;

        if(user.firstName == localStorage.getItem("user")){
            memberDiv.style.backgroundColor="#8c8c8c73";
        }

        memberList.appendChild(memberDiv);
    });
    hideLoader();
}



const style = document.createElement('style');
style.innerHTML = `
#dashboardTabs {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  max-width: 600px;
  margin: auto;
}

.tab {
  background-color: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.device-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.leaderboard {
  margin-top: 15px;
  border-top: 1px solid #ccc;
  padding-top: 10px;
}
.leaderboard-item {
  padding: 5px 0;
}
`;
document.head.appendChild(style);

async function showDashboard() {
  document.getElementById('memberList').style.display = "none";
  document.getElementById('dashboard').style.display = "block";
  const dashboard = document.getElementById('dashboard');
  dashboard.innerHTML = '<div id="dashboardTabs"></div>';
  const container = document.getElementById("dashboardTabs");

  try {
    const response = await fetch(`${serverURL}/competition/getAll`);
    if (!response.ok) throw new Error("Fehler beim Laden der Wettkämpfe");
    const competitions = await response.json();
    const user = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");
    const now = new Date();

    competitions.forEach(competition => {
      const competitionDate = new Date(competition.date);
      const isPast = competitionDate < now;
      const tab = document.createElement("div");
      tab.className = "tab";

      const header = document.createElement("div");
      header.className = "tab-header";
      header.innerHTML = `
        <h3>${competition.name} (${new Date(competition.date).toLocaleDateString()})</h3>
        <p><strong>Ort:</strong> ${competition.location}</p>
      `;
      tab.appendChild(header);

      const alreadyParticipant = competition.participants?.some(p => p.id === userId);

      if (!alreadyParticipant && !isPast) {
        const joinBtn = document.createElement("button");
        joinBtn.textContent = "✅ Teilnehmen";
        joinBtn.onclick = async () => {
          const res = await fetch(`${serverURL}/competition/${competition._id}/addParticipant`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, name: user }) 
          });
          if (res.ok) showDashboard();
        };
        tab.appendChild(joinBtn);
      } else if (alreadyParticipant && !isPast){
        const form = document.createElement("div");
        form.className = "device-form";
        form.innerHTML = `
          <label>Gerät wählen:
            <select id="deviceSelect-${competition._id}" onchange="changeDeviceInput(this.value);">
              <option>Boden</option>
              <option>Barren</option>
              <option>Sprung</option>
              <option>Reck</option>
              <option>Ringe</option>
              <option>Pauschenpferd</option>
            </select>
          </label>
          <label>Punkte (max. <span id="maxPointsDisplay">--</span>):
            <input type="number" id="pointsInput-${competition._id}" max="10" min="0" step="0.1">
          </label>
          <button id="addDeviceBtn-${competition._id}">Punkte hinzufügen</button>
        `;
        tab.appendChild(form);

        const leaveBtn = document.createElement("button");
        leaveBtn.textContent = "Vom Wettkampf abmelden";
        leaveBtn.style.backgroundColor = "#f44336";
        leaveBtn.style.color = "white";
        leaveBtn.style.width = "100%";
        leaveBtn.onclick = async () => {
        const confirmLeave = confirm(`Möchtest du wirklich vom Wettkampf "${competition.name}" zurücktreten?`);
        if (confirmLeave) {
            const res = await fetch(`${serverURL}/competition/${competition._id}/removeParticipant/${userId}`, {
              method: "DELETE"
            });
            if (res.ok) {
            showDashboard();
            } else {
            showMessage("Fehler beim Abmelden", "Es konnte nicht erfolgreich aus dem Wettkampf ausgetreten werden!");
            }
        }
        };
        tab.appendChild(leaveBtn);

        form.querySelector(`#addDeviceBtn-${competition._id}`).onclick = async () => {
            const device = form.querySelector(`#deviceSelect-${competition._id}`).value;
            const points = parseFloat(form.querySelector(`#pointsInput-${competition._id}`).value);
            
            if (!isNaN(points) && points > 0 && points < maxPoints[keyAliases[device]]) {
              const participant = competition.participants.find(p => p.id === userId);
              const existingDevice = participant.devices.find(d => d.name === device);
          
              const endpoint = existingDevice
                ? `${serverURL}/competition/${competition._id}/updateDevice/${userId}`
                : `${serverURL}/competition/${competition._id}/addDevice/${userId}`;
          
              await fetch(endpoint, {
                method: existingDevice ? "PUT" : "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceName: device, points })
              });
          
              showDashboard();
            } else {
                showMessage("Falsche Eingaben", "Es können nur gültige Punkte hinzugefügt werden!");
                form.querySelector(`#pointsInput-${competition._id}`).value= "";
            }
          };
          
      }

      const leaderboard = document.createElement("div");
      leaderboard.className = "leaderboard";
      leaderboard.innerHTML = `
        <h4>🏆 Rangliste</h4>
        <label>Sortierung:
            <select id="sortSelect-${competition._id}">
            <option value="total">Gesamtpunkte</option>
            <option value="average">Durchschnittspunkte</option>
            <option value="devices">Anzahl Geräte</option>
            </select>
        </label>
        <div id="leaderboardEntries-${competition._id}"></div>
        `;
        tab.appendChild(leaderboard);
        container.appendChild(tab);

        if (competition.participants?.length > 0) {
            renderLeaderboard(competition, `leaderboardEntries-${competition._id}`, "total");
          
            document.getElementById(`sortSelect-${competition._id}`).addEventListener("change", (e) => {
              const sortType = e.target.value;
              renderLeaderboard(competition, `leaderboardEntries-${competition._id}`, sortType);
            });
          } else {
            const leaderboardContainer = document.getElementById(`leaderboardEntries-${competition._id}`);
            leaderboardContainer.innerHTML = `<p>Keine Teilnehmer.</p>`;
          }
    });
  } catch (error) {
    console.error("Fehler beim Laden des Dashboards:", error);
  }
  changeDeviceInput("Boden");
}

let maxPoints = {
    "FL" : 0,
    "PO" : 0, 
    "RI" : 0,
    "VA" : 0,
    "PA" : 0,
    "HI" : 0
};
let keyAliases = {
    "Boden": "FL",
    "Pauschenpferd": "PO",
    "Ringe": "RI",
    "Sprung": "VA",
    "Barren": "PA",
    "Reck": "HI"
}

async function loadMaxPoints() {
    const user = localStorage.getItem("user");
    if (!user) {
        console.warn("⚠️ Kein Benutzer im Local Storage.");
        return;
    }
    try {
        const response = await fetch(`${serverURL}/routine/getMaxPoints?user=${encodeURIComponent(user)}`);
        if (!response.ok) {
            throw new Error(`Serverfehler: ${response.status}`);
        }
        const data = await response.json();

        for (const key in maxPoints) {
            maxPoints[key] = data[key] ?? 0;
        }

    } catch (error) {
        console.error("❌ Fehler beim Laden der Punkte:", error);
    }
}

function changeDeviceInput(device){
    let maxPoint = maxPoints[keyAliases[device]];
    document.getElementById('maxPointsDisplay').innerText=maxPoint.toFixed(1);
}

function renderLeaderboard(competition, containerId, sortType) {
    const sorted = competition.participants.map(p => {
      const total = p.devices.reduce((sum, d) => sum + d.points, 0);
      const deviceCount = p.devices.length;
      const average = deviceCount > 0 ? total / deviceCount : 0;
      return { ...p, total, deviceCount, average };
    }).sort((a, b) => {
      if (sortType === "average") return b.average - a.average;
      if (sortType === "devices") return b.deviceCount - a.deviceCount;
      return b.total - a.total;
    });
  
    const leaderboardContainer = document.getElementById(containerId);
    leaderboardContainer.innerHTML = "";
  
    sorted.forEach(p => {
      const entry = document.createElement("div");
      entry.className = "leaderboard-item";
      entry.innerHTML = `
        <strong>${p.name}</strong> – ${p.total.toFixed(1)} Punkte
        <br><small>${p.devices.map(d => `${d.name}: ${d.points}`).join(', ')}</small>
      `;
      leaderboardContainer.appendChild(entry);
    });
}
  


//----------------------------------------------------------------------------------------------------------------- Ab hier: Routine handling

//globale field for current status
let currentExerciseFlag = null
let currentExercise = [];
let currentExerciseDetailedList = [];
let currentDevice = null;
let routineType = "0";

let pageDepth = 0;
let autoRoutineSafe = null;


//----------------------------------------------------------------------------------------------------------------- change Routine Type

function changeRoutineType() {
    const changeBtn = document.getElementById("changeRoutineType");

    if(routineType == "0"){
        routineType = "1";
        changeBtn.innerHTML = `<i>Wettkampf</i> / <strong>Wunsch</strong>`;
        changeBtn.style.backgroundColor = "rgb(102, 128, 0)";
    }else {
        routineType = "0";
        changeBtn.innerHTML = `<strong>Wettkampf</strong> / <i>Wunsch</i>`;
        changeBtn.style.backgroundColor = "rgb(128, 45, 0)";
    }
    loadCurrentExercise(localStorage.getItem("user"), currentDevice, true, routineType);
}


//----------------------------------------------------------------------------------------------------------------- request exercise of a user

async function requestUserExercise(username, device, routineType) {
    currentExercise = [];
    currentExerciseDetailedList = [];
    showLoader();
    try {
        if (!username || !device) throw new Error("Exercise request failed: Invalid params");
        const response = await fetch(`${serverURL}/exercise/get?device=${device}&vorname=${username}&routineType=${routineType}`);
        
        if (response.ok) {
            const exerciseData = await response.json();

            if (exerciseData.elemente) {
                exerciseData.elemente.forEach(element => {
                    if (element != null){
                        currentExercise.push(element);
                    }
                });
            }
            currentExerciseDetailedList = await Promise.all(
                currentExercise.map(el => getElementDetails(el))
            );

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
        showMessage("Fehler beim Laden der Übung", error);
        return null;
    }
}

//----------------------------------------------------------------------------------------------------------------- get all Routines of a user

async function getAllUserExercise(username) {
    const devices = ["FL", "PO", "RI", "VA", "PA", "HI"];
    const sRoutineType = "0";
    let userExerciseList = [];

    showLoader();
    for (const currDev of devices) {
        currentDevice = currDev;
        var currentExerciseList = await requestUserExercise(username, currentDevice, sRoutineType);
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
        } else {
            exerciseDiv.innerHTML = `<p>Keine Übungen gefunden</p>`;
        }

        exerciseContainer.appendChild(deviceButton);
        exerciseContainer.appendChild(exerciseDiv);
    }
}

//----------------------------------------------------------------------------------------------------------------- validate Routine

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

//----------------------------------------------------------------------------------------------------------------- toggle Visibility

function toggleUIElementVisibility(elements, displayValue) {
    elements.forEach(element => {
        document.getElementById(element).style.display = displayValue;
    });
}


//----------------------------------------------------------------------------------------------------------------- Handle Routine Panel

function createRoutine() {
    pageDepth = 1;
    const changeBtn = document.getElementById('changeRoutineType');
    routineType = "0";
    changeBtn.innerHTML = `<strong>Wettkampf</strong> / <i>Wunsch</i>`;
    changeBtn.style.backgroundColor = "rgb(128, 45, 0)";

    toggleUIElementVisibility(
        ['infoBlock', 'createRoutineBtn', 'elementSelection', 'detailedElementInfo'],
        'none'
    );
    document.getElementById('exerciseCreationPanel').style.display = 'block';
    document.getElementById("selected-exercises-list").innerHTML = "";
    loadCurrentExercise(localStorage.getItem("user"), currentDevice, true, routineType);
    autoRoutineSafe = setTimeout(() => {
        safeExercise();
    }, 0.5*60*1000);
}

function closeDevice() {
    if(pageDepth == 2){
        document.getElementById('elementSelection').style.display="none";
        document.getElementById('detailedElementInfo').style.display="none";
        document.getElementById('exerciseCreationButtonPanel').style.display="flex";
        document.getElementById('selected-exercises-list').style.display="flex";
        loadCurrentExercise(localStorage.getItem("user"), currentDevice, false);
    }
    else if(pageDepth == 1){
        document.getElementById('exerciseCreationPanel').style.display="none";
        document.getElementById('infoBlock').style.display="block";
        document.getElementById('createRoutineBtn').style.display="block";
        safeExercise();
    }
    else if(pageDepth == 0){
        clearTimeout(autoRoutineSafe);
        document.getElementById('EquipmentExercise').style.display="none";
    } else {
        togglePanel(1);
    }
    pageDepth-=1;
}


//----------------------------------------------------------------------------------------------------------------- Load safed Exercise

async function loadCurrentExercise(username, device, remote, routineType) {
    if (!username || !device) {
        console.log("Invalid Arguments for loading current Exercise", username, ", ", device);
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

    let summaryContainer = document.createElement("div");
    summaryContainer.id = "exercise-summary-container";
    exerciseContainer.appendChild(summaryContainer);
    updateExerciseSummary();
    hideLoader();
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
    actionCell.className = "action-cell";

    let arrowContainer = document.createElement("div");
    arrowContainer.className = "arrow-container";

    let upArrow = document.createElement("button");
    upArrow.innerHTML = "⬆️";
    upArrow.className = "arrow-btn";
    upArrow.addEventListener("click", () => moveElementUp(index));

    let downArrow = document.createElement("button");
    downArrow.innerHTML = "⬇️";
    downArrow.className = "arrow-btn";
    downArrow.addEventListener("click", () => moveElementDown(index));

    arrowContainer.appendChild(upArrow);
    arrowContainer.appendChild(downArrow);

    let trashIcon = document.createElement("button");
    trashIcon.innerHTML = "🗑️";
    trashIcon.className = "delete-btn";
    trashIcon.addEventListener("click", () => removeElementFromExercise(index));

    actionCell.appendChild(arrowContainer);
    actionCell.appendChild(trashIcon);

    row.appendChild(numCell);
    row.appendChild(nameCell);
    row.appendChild(imgCell);
    row.appendChild(actionCell);

    return row;
}


//----------------------------------------------------------------------------------------------------------------- remove Element from routine

async function removeElementFromExercise(index) {
    if (!currentExercise || !currentExerciseDetailedList) {
        console.error("Fehler: currentExercise ist nicht definiert oder enthält keine Elemente.");
        return;
    }
    currentExercise.splice(index, 1);
    currentExerciseDetailedList.splice(index, 1);

    await loadCurrentExercise(localStorage.getItem("user"), currentDevice, false);

    updateExerciseSummary();
}


//----------------------------------------------------------------------------------------------------------------- add Element to Routine

async function addToExercise(element) {
    document.getElementById('detailedElementInfo').style.display="none";
    currentExercise.push(element.id);
    let detailedInfo = await getElementDetails(element.id);
    currentExerciseDetailedList.push(detailedInfo);

    await loadCurrentExercise(localStorage.getItem("user"), currentDevice, false);

    updateExerciseSummary();
}


//----------------------------------------------------------------------------------------------------------------- change Routine Order

async function moveElementUp(index) {
    showLoader();
    
    if (index <= 0) {
        console.warn("Das Element ist bereits ganz oben");
        hideLoader();
        return;
    }

    [currentExercise[index - 1], currentExercise[index]] = [currentExercise[index], currentExercise[index - 1]];
    [currentExerciseDetailedList[index - 1], currentExerciseDetailedList[index]] = 
        [currentExerciseDetailedList[index], currentExerciseDetailedList[index - 1]];

    await loadCurrentExercise(localStorage.getItem("user"), currentDevice, false);

    hideLoader();
}

async function moveElementDown(index) {
    showLoader();
    
    let routineLength = currentExercise.length;
    if (index >= routineLength - 1) {
        console.warn("Das Element ist bereits ganz unten");
        hideLoader();
        return;
    }

    let newExercise = [...currentExercise];
    let newExerciseDetailed = [...currentExerciseDetailedList];

    [newExercise[index], newExercise[index + 1]] = [newExercise[index + 1], newExercise[index]];
    [newExerciseDetailed[index], newExerciseDetailed[index + 1]] = [newExerciseDetailed[index + 1], newExerciseDetailed[index]];

    currentExercise = newExercise;
    currentExerciseDetailedList = newExerciseDetailed;

    await loadCurrentExercise(localStorage.getItem("user"), currentDevice, false);
    
    hideLoader();
}


//----------------------------------------------------------------------------------------------------------------- Update Routine Summary

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


//----------------------------------------------------------------------------------------------------------------- show Element selection

function selectElement() {
    pageDepth = 2;
    document.getElementById('elementSelection').style.display = "block";
    document.getElementById('exerciseCreationButtonPanel').style.display = "none";  
    document.getElementById('allElemBtn').style.border = "solid 2px black";
    
    activeFilter_difficulty = null;
    activeFilter_group = null;
    activeFilter_text = null;
    activeFilter_learnedElem = null;
    getElements(null, null);
}


//----------------------------------------------------------------------------------------------------------------- Element-Filter Handling
let activeFilter_difficulty = null;
let activeFilter_group = null;
let activeFilter_text = null;
let activeFilter_learnedElem = null;


function getFilteredElementList() {
    let difficulty = activeFilter_difficulty;
    let group = activeFilter_group;
    let searchText = activeFilter_text;
    let learnedElements = activeFilter_learnedElem;

    getElements(difficulty, group, searchText, learnedElements);
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
    document.querySelectorAll("#filterDifficulty button").forEach(button => button.style.backgroundColor = "#444");
    pressedBtn.style.backgroundColor = "#777777";
    activeFilter_difficulty = difficulty;
    getFilteredElementList();
}

function filterByGroup(group, pressedBtn) {
    document.querySelectorAll("#filterGroup button").forEach(button => button.style.backgroundColor = "#444");
    pressedBtn.style.backgroundColor = "#777777";
    activeFilter_group = group;
    getFilteredElementList();
}

function filterByText() {
    activeFilter_text = document.getElementById("searchInput").value.trim();
    getFilteredElementList();
}
  


//----------------------------------------------------------------------------------------------------------------- get filtered Elements

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
        elements.forEach(element => {
            const exerciseDiv = createElementDiv(element, togglePage, currLearnedElements.includes(element.id));
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


//----------------------------------------------------------------------------------------------------------------- Handle Detailed element view

function createElementDiv(element, togglePage, learned) {
    const exerciseDiv = document.createElement("div");
    exerciseDiv.classList.add("exercise-item");
    exerciseDiv.onclick = () => openDetailedView(element, currLearnedElements.includes(element.id));

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

function openDetailedView(element, learned) {
    const container = document.getElementById('detailedElementInfo');
    const title = document.getElementById('elementTitle');
    const description = document.getElementById('elementText');
    const img = document.getElementById('elementImage');
    const name = document.getElementById('elementName');
    const group = document.getElementById('elementGroup');
    const difficulty = document.getElementById('elementDifficulty');
    const addButton = document.getElementById('addToList');
    const endingCheck = document.getElementById('validEnding');

    title.innerText = element.bezeichnung;
    description.innerText = element.bezeichnung;
    img.src = element.image_path;
    name.innerText = element.name || "Name: ";
    group.innerText = "Elementegruppe: " + element.elementegruppe;
    difficulty.innerText = "Schwierigkeit: " + element.wertigkeit;
    endingCheck.innerText = "Übungsende: " + (element.dismount == true ? "✅" : "❌");

    addButton.replaceWith(addButton.cloneNode(true));
    if(!learned){
        setLearnedButton(true, element.id);
    }else {
        setLearnedButton(false, element.id);
    }
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
        const response = await fetch(`${serverURL}/exercise/get_element?id=${elementId}&currentDevice=${deviceCode}`);
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
function safeExercise(){
    console.log("Safe Exercise");
    safeUpdateExercise(currentExercise, routineType);
    loadMaxPoints();
}

async function safeUpdateExercise(elementList, pRoutineType) {
    const username = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");
    const device = currentDevice;

    if (!username || !device || !userId || !pRoutineType) {
        console.error("Benutzername /-ID, Gerät oder Routine-Type nicht gefunden.");
        return;
    }
    const filteredElements = elementList.filter(element => element !== null && element !== undefined);
    const payload = {
        vorname: username,
        userId: userId,
        geraet: device,
        elemente: filteredElements,
        routineType: pRoutineType
    };
    showLoader();
    try {
        const response = await fetch(`${serverURL}/exercise/update`, {
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





let currLearnedElements = [];

async function loadCompletedUserList(device) {
    currLearnedElements = [];
    try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            console.error("Benutzer-ID nicht gefunden.");
            return;
        }
        const response = await fetch(`${serverURL}/account/getLearnedElements?userId=${userId}&device=${device}`);
        if(response.ok) {
            const data = await response.json();
            currLearnedElements = data.learnedElements;
        }
    } catch (error) {
        console.error("Error while fetching the learned Elements", error);
        return;
    }
}

function resetClickListeners(id) {
    const oldButton = document.getElementById(id);
    const newButton = oldButton.cloneNode(true);
    oldButton.parentNode.replaceChild(newButton, oldButton);
    return newButton;
}

function setLearnedButton(learned, element){
    if(learned){
        const button = resetClickListeners('isLearned');
        button.style.backgroundColor = "rgb(27, 61, 95)";
        button.innerText = "Element gelernt";
        button.addEventListener("click", () => addToCompleted(element));
    }else {
        const button = resetClickListeners('isLearned');
        button.style.backgroundColor = "rgb(125, 39, 39)";
        button.innerText = "Element verlernt";
        button.addEventListener("click", () => removeFromCompleted(element));    
    }
}

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

async function removeFromCompleted(element) {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        console.error("Kein Benutzer-ID im Local Storage gefunden.");
        return;
    }
    try {
        const response = await fetch(`${serverURL}/account/removeLearnedElement`, {
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
            setLearnedButton(true, element);
            const index = currLearnedElements.indexOf(element);
            if (index > -1) {
                currLearnedElements.splice(index, 1);
            }

        } else {
            console.error("Fehler beim Hinzufügen des Elements:", data.message);
        }
    } catch (error) {
        console.error("Fehler bei der Anfrage:", error);
    }
}
