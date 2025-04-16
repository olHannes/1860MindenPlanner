window.onload = function () {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    if(localStorage.getItem("startUpInfo") != null) {
        document.getElementById("startupInformation").style.display="none";
    }
    checkUserStatus();
};

//----------------------------------------------------------------------------------------------------------------- hide info
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("closeInfoBox").addEventListener("click", function() {
        document.getElementById("startupInformation").style.display = "none";
        localStorage.setItem("startUpInfo", true);
    });

    document.getElementById("closeNews").addEventListener("click", function() {
        document.getElementById("news").style.display = "none";
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
            document.getElementById('add-exercise-btn').style.display = "block";  

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



//----------------------------------------------------------------------------------------------------------------- Login Handling

// login User
async function login() {
    let username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    if(username!= "admin"){
        username = normalizeName(username);
    }
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
            localStorage.setItem("user", username);
            localStorage.setItem("userId", data.userId);
            return;
        }

        if (response.ok && data.message === "Login erfolgreich!") {
            localStorage.setItem("user", username);
            localStorage.setItem("userId", data.userId);
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

// Update User Status
async function checkUserStatus() {
    const username = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");

    if (!username || !userId) return;

    showLoader();
    try {
        const response = await fetch(`https://one860mindenplanner.onrender.com/account/checkUserStatus?name=${username}&userId=${userId}`, {
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
        }

    } catch (error) {
        hideLoader();
        console.error("Error:", error);
    }
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
        const response = await fetch(`https://one860mindenplanner.onrender.com/account/getUserInfo?userId=${userId}`, {
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
        checkLoginStatus();
        console.error("Error:", error);
    }
}



//----------------------------------------------------------------------------------------------------------------- Logout Handling

// User Logout
async function logout() {
    const username = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");
    console.log(username, " ", userId);
    if (!username || !userId) {
        document.getElementById("errorMsg").textContent = "Kein Benutzer eingeloggt!";
    }

    showLoader();
    try {
        const response = await fetch("https://one860mindenplanner.onrender.com/account/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username, userId })
        });

        const data = await response.json();
        hideLoader();
        console.log(data.message);
        if (response.ok && (data.message === "Erfolgreich ausgeloggt!" || data.message === "Kein Benutzername oder Benutzer-ID angegeben!")) {
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
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
        const response = await fetch("https://one860mindenplanner.onrender.com/account/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username, userId })
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Logout: ${response.status} ${response.statusText}`);
        }
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
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
        const response = await fetch("https://one860mindenplanner.onrender.com/account/delete", {
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
        checkLoginStatus();

        alert("Dein Account wurde erfolgreich gelöscht!");
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
        const response = await fetch("https://one860mindenplanner.onrender.com/account/changeData", {
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
        localStorage.setItem("user", vorname);  // Username updaten
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
async function updatePassword(username, newPassword) {
    const userId = localStorage.getItem("userId");

    if (!username || !newPassword || !userId) {
        document.getElementById('passwordEdit').style.display = "none";
        document.getElementById('nameView').style.display = "block";
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
                userId: userId,
                newPassword: newPassword
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Fehler beim Aktualisieren des Passworts");
        }
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Passworts:", error);
        alert("Fehler: " + error.message);
    }
    document.getElementById('passwordEdit').style.display = "none";
    document.getElementById('nameView').style.display = "block";   
}

function cancleEdits(){
    document.getElementById('nameEdit').style.display="none";
    document.getElementById('passwordEdit').style.display="none";
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
        const response = await fetch("https://one860mindenplanner.onrender.com/account/user/colorChange", {
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



//----------------------------------------------------------------------------------------------------------------- Report Handling <Admin>

function goToAdminReportContainer(){
    emptyAdminContainer();
    loadAdminReports();
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
        const response = await fetch('https://one860mindenplanner.onrender.com/competition/getAll');
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
                            deleteParticipant(competition.id, participant.id);
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
        const response = await fetch(`https://one860mindenplanner.onrender.com/competition/delete/${competitionId}`, {
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
        const response = await fetch(`https://one860mindenplanner.onrender.com/competition/${competitionId}/removeParticipant/${participantId}`, {
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
        const response = await fetch('https://one860mindenplanner.onrender.com/competition/create', {
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
    document.getElementById('dashboard').style.display="none";
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';
    memberList.style.display="block";

    showLoader();
    const data = await getAllUser();
    data.sort((a, b) => a.lastName.localeCompare(b.lastName));
    data.forEach(user => {
        if (user.firstName === "admin") return; 
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
    const response = await fetch("https://one860mindenplanner.onrender.com/competition/getAll");
    if (!response.ok) throw new Error("Fehler beim Laden der Wettkämpfe");
    const competitions = await response.json();
    console.log(competitions);
    const user = localStorage.getItem("user");
    const userId = localStorage.getItem("userId");

    competitions.forEach(competition => {
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

      if (!alreadyParticipant) {
        const joinBtn = document.createElement("button");
        joinBtn.textContent = "✅ Teilnehmen";
        joinBtn.onclick = async () => {
          const res = await fetch(`https://one860mindenplanner.onrender.com/competition/${competition._id}/addParticipant`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: userId })
          });
          if (res.ok) showDashboard();
        };
        tab.appendChild(joinBtn);
      } else {
        const form = document.createElement("div");
        form.className = "device-form";
        form.innerHTML = `
          <label>Gerät wählen:
            <select id="deviceSelect-${competition._id}">
              <option>Boden</option>
              <option>Barren</option>
              <option>Sprung</option>
              <option>Reck</option>
              <option>Ringe</option>
              <option>Pauschenpferd</option>
            </select>
          </label>
          <label>Punkte (max. 10):
            <input type="number" id="pointsInput-${competition._id}" max="10" min="0" step="0.1">
          </label>
          <button id="addDeviceBtn-${competition._id}">📥 Hinzufügen</button>
        `;
        tab.appendChild(form);

        form.querySelector(`#addDeviceBtn-${competition._id}`).onclick = async () => {
          const device = form.querySelector(`#deviceSelect-${competition._id}`).value;
          const points = parseFloat(form.querySelector(`#pointsInput-${competition._id}`).value);
          if (!isNaN(points)) {
            await fetch(`https://one860mindenplanner.onrender.com/competition/${competition._id}/addDevice/${userId}`, {
              method: "POST",
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceName: device, points })
            });
            showDashboard();
          }
        }
      }

      const leaderboard = document.createElement("div");
      leaderboard.className = "leaderboard";
      leaderboard.innerHTML = `<h4>🏆 Rangliste</h4>`;

      if (competition.participants?.length > 0) {
        const sorted = competition.participants.map(p => {
          const total = p.devices.reduce((sum, d) => sum + d.points, 0);
          return { ...p, total };
        }).sort((a, b) => b.total - a.total);

        sorted.forEach(p => {
          const entry = document.createElement("div");
          entry.className = "leaderboard-item";
          entry.innerHTML = `
            <strong>${p.name}</strong> – ${p.total} Punkte
            <br><small>${p.devices.map(d => `${d.name}: ${d.points}`).join(', ')}</small>
          `;
          leaderboard.appendChild(entry);
        });
      } else {
        leaderboard.innerHTML += `<p>Keine Teilnehmer.</p>`;
      }

      tab.appendChild(leaderboard);
      container.appendChild(tab);
    });
  } catch (error) {
    console.error("Fehler beim Laden des Dashboards:", error);
  }
}

















//-----------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------- Ab hier: Routine handling
//-----------------------------------------------------------------------------------------------------------------

//globale field for current status
let currentExercise = [];
let currentExerciseDetailedList = [];
let currentDevice = null;


//----------------------------------------------------------------------------------------------------------------- request exercise of a user

async function requestUserExercise(username, device) {
    currentExercise = [];
    currentExerciseDetailedList = [];
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
            let { warnings, errors, totalDifficulty, totalElements, groupList, isComplete, baseDifficulty, groupBonus, dismountBonus } = validRoutine(elements, device);

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

function validRoutine(elements, device) {
    if(device == "VA"){
        return validRoutineVA(elements, device);
    }
    console.log("valid Routine '", elements, "' for ", device);

    const requiredGroups = {
        "FL": new Set(["1", "2", "3"]), 
        "PO": new Set(["1", "2", "3", "4"]), 
        "RI": new Set(["1", "2", "3", "4"]), 
        "VA": new Set([]), 
        "PA": new Set(["1", "2", "3", "4"]), 
        "HI": new Set(["1", "2", "3", "4"])
    };

    let totalDifficulty = 10;
    let elementGroups = new Map();
    let hasDismount = false;
    let seenElements = new Map();
    let warnings = [];
    let errors = [];
    let isDismountAtEnd = false;
    
    let difficulties = [];
    let dismountValue = 0;

    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let wertigkeit = parseFloat(element.wertigkeit) || 0;

        if (element.dismount) {
            hasDismount = true;
            dismountValue = wertigkeit;
            if (i === elements.length - 1) {
                isDismountAtEnd = true;
                dismountValue = wertigkeit;
            }
        } else {
            difficulties.push(wertigkeit);
        }

        if (element.elementegruppe) {
            elementGroups.set(element.elementegruppe, (elementGroups.get(element.elementegruppe) || 0) + 1);
        }

        if (element.bezeichnung) {
            seenElements.set(element.bezeichnung, (seenElements.get(element.bezeichnung) || 0) + 1);
        }
    }

    difficulties.sort((a, b) => b - a);
    let topSix = difficulties.slice(0, 6);

    let baseDifficulty = topSix.reduce((sum, val) => sum + val, 0) * 2;
    baseDifficulty += dismountValue * 2;

    let requiredGroupSet = requiredGroups[device] || new Set();
    let missingGroups = [...requiredGroupSet].filter(group => !elementGroups.has(group));

    let groupBonus = 0;
    for (let group of elementGroups.keys()) {
        if (group && parseFloat(group) > 0.05) {
            groupBonus += 0.5;
        }
    }

    let dismountBonus = (dismountValue >= 0.1) ? (dismountValue === 0.1 ? 0.3 : 0.5) : 0;

    totalDifficulty += baseDifficulty + groupBonus + dismountBonus;

    let totalElements = elements.length;
    let groupList = [...elementGroups.keys()].sort().join(", ");
    let isComplete = 
        device === "VA" 
            ? totalElements === 1 
            : missingGroups.length === 0 && hasDismount && totalElements >= 7 && isDismountAtEnd;

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


    if (totalElements < 7) {
        errors.push(`❌ Zu wenig Elemente: ${totalElements}`);
    }
    if (missingGroups.length > 0) {
        errors.push(`❌ Fehlende Gruppen: ${missingGroups.join(", ")}`);
    }
    if (!hasDismount) {
        errors.push("❌ Kein Abgang vorhanden");
    }
    if (hasDismount && !isDismountAtEnd) {
        errors.push("❌ Der Abgang muss am Ende der Übung sein.");
    }

    return { warnings, errors, totalDifficulty, totalElements, groupList, isComplete, baseDifficulty, groupBonus, dismountBonus };
}

function validRoutineVA(elements, device) {
    console.log("Validiere Sprung-Routine:", elements);

    let warnings = [];
    let errors = [];
    let highestDifficulty = 0;
    let groupList = "";
    
    if (elements.length !== 1) {
        errors.push("❌ Eine Sprung-Übung darf nur ein Element enthalten.");
    }

    elements.forEach(el => {
        let wertigkeit = parseFloat(el.wertigkeit) || 0;
        if (wertigkeit > highestDifficulty) {
            highestDifficulty = wertigkeit;
        }
    });

    let elementGroup = elements[0]?.elementegruppe || null;
    if (elementGroup) {
        groupList = elementGroup.toString();
    }

    let totalDifficulty = 10 + highestDifficulty;

    return {
        warnings,
        errors,
        totalDifficulty,
        totalElements: elements.length,
        groupList,
        isComplete: errors.length === 0,
        baseDifficulty: highestDifficulty,
        groupBonus: 0,
        dismountBonus: 0
    };
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
    currentExerciseDetailedList = [];

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
    loadCurrentExercise(localStorage.getItem("user"), currentDevice, true);
    console.log("start autosafe");
    autoRoutineSafe = setTimeout(() => {
        safeExercise();
    }, 0.5*60*1000);
}

let autoRoutineSafe = null;

function closeDevice() {
    if(pageDepth == 2){
        document.getElementById('elementSelection').style.display="none";
        document.getElementById('detailedElementInfo').style.display="none";
        document.getElementById('add-exercise-btn').style.display="block";
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

async function loadCurrentExercise(username, device, remote) {
    console.log("load Exercise");
    if (!username || !device) {
        console.log("Invalid Arguments for loading current Exercise", username, ", ", device);
        return;
    }
    showLoader();
    if(remote){
        await requestUserExercise(username, device);
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
    let { warnings, errors, totalDifficulty, totalElements, groupList, isComplete, baseDifficulty, groupBonus, dismountBonus } = validRoutine(currentExerciseDetailedList, device);
    
    let summaryContainer = document.getElementById("exercise-summary-container");
    if (!summaryContainer) return;

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

    // Hinzufügen des Klick-Events
    document.getElementById("total-difficulty").addEventListener("click", function() {
        let details = document.getElementById("difficulty-details");
        // Toggle die Anzeige des Details
        details.style.display = details.style.display === "none" ? "block" : "none";
    });
}



//----------------------------------------------------------------------------------------------------------------- show Element selection

function selectElement() {
    pageDepth = 2;
    document.getElementById('elementSelection').style.display = "block";
    document.getElementById('add-exercise-btn').style.display = "none";  
    document.getElementById('allElemBtn').style.border = "solid 2px black";
    getElements(null, null);
}


//----------------------------------------------------------------------------------------------------------------- Element-Filter Handling

let activeFilter_difficulty = null;
let activeFilter_group = null;
let activeFilter_text = null;

function getFilteredElementList() {
    let difficulty = activeFilter_difficulty;
    let group = activeFilter_group;
    let searchText = activeFilter_text;

    getElements(difficulty, group, searchText);
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

async function getElements(difficulty, group, searchText) {
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
        const params = { Device: device, Difficulty: difficulty , Group: group, Text: searchText};
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
    name.innerText = element.name || "Name: ";
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
function safeExercise(){
    console.log("Safe Exercise");
    safeUpdateExercise(currentExercise);
}

async function safeUpdateExercise(elementList) {
    const username = localStorage.getItem("user");
    const device = currentDevice;

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