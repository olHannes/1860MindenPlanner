//window.onload = checkLoginStatus;

window.onload = function () {
    checkUserStatus();
};


//----------------------------------------------------------------------------------------------------------------- Page change

let activePanel = null;

function togglePanel(panelId) {
    const panel = document.getElementById('panel' + panelId);
    console.log(panel);
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
        const response = await fetch("http://127.0.0.1:5000/account/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, password: newPassword })
        });

        const data = await response.json();

        if (response.ok && data.message === "Registrierung erfolgreich!") {
            cancelRegistration();
            document.getElementById("errorMsgRegister").textContent = "";
            clearLoginInput();
            document.getElementById("errorMsg").textContent = "Nutzer erfolgreich registriert!";
        } else {
            document.getElementById("errorMsgRegister").textContent = "Benutzername bereits vergeben!";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("errorMsgRegister").textContent = "Ein unerwarteter Fehler ist aufgetreten!";
    }
}


//----------------------------------------------------------------------------------------------------------------- Login

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://127.0.0.1:5000/account/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

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
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Ein unerwarteter Fehler ist aufgetreten!";
    }
}


//----------------------------------------------------------------------------------------------------------------- User Status

async function checkUserStatus() {
    const username = localStorage.getItem("user");

    if (!username) return;

    try {
        const response = await fetch(`http://127.0.0.1:5000/account/checkUserStatus?name=${username}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Fehler: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data.message);

        if (data.message === "Benutzer offline, Status zurückgesetzt!") {
            localStorage.removeItem("user");
            window.location.href = "/login";
        }

    } catch (error) {
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

    try {
        const response = await fetch("http://127.0.0.1:5000/account/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username })
        });

        const data = await response.json();

        if (response.ok && data.message === "Erfolgreich ausgeloggt!") {
            localStorage.removeItem("user");
            checkLoginStatus();
        } else {
            document.getElementById("errorMsg").textContent = data.message || "Unbekannter Fehler!";
        }

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Fehler beim Logout!";
    }
}


//----------------------------------------------------------------------------------------------------------------- Auto Logout

window.onbeforeunload = async function () {
    const username = localStorage.getItem("user");

    if (!username) return;

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
    } catch (error) {
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
        localStorage.removeItem("user");
        checkLoginStatus();

        alert("Dein Account wurde erfolgreich gelöscht!");
        document.getElementById('requestDelAcc').style.display="none";

    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
        console.error("Error beim Verlassen der Seite:", error);
    }
}








function openExercise(id){
    document.getElementById('EquipmentExercise').style.display="block";
    const deviceImage = document.getElementById('DeviceImage');
    const headerDe = document.getElementById('Device-de');
    const headerEn = document.getElementById('Device-en');
    switch (id) {
        case 0:
            deviceImage.src = "assets/images/equipment/Floor_icon.png";
            headerDe.textContent = "Boden";
            headerEn.textContent = "Floor";
            break;
        
        case 1:
            deviceImage.src = "assets/images/equipment/Pommelhorse_icon.png";
            headerDe.textContent = "Pauschenpferd";
            headerEn.textContent = "Pommel Horse";
            break;
        
        case 2:
            deviceImage.src = "assets/images/equipment/Rings_icon.png";
            headerDe.textContent = "Ringe";
            headerEn.textContent = "Rings";
            break;
        
        case 3:
            deviceImage.src = "assets/images/equipment/Vault_icon.png";
            headerDe.textContent = "Sprung";
            headerEn.textContent = "Vault";
            break;
        
        case 4:
            deviceImage.src = "assets/images/equipment/Parralelbars_icon.png";
            headerDe.textContent = "Barren";
            headerEn.textContent = "Parralel Bars";
            break;
        
        case 5:
            deviceImage.src = "assets/images/equipment/Highbar_icon.png";
            headerDe.textContent = "Reck";
            headerEn.textContent = "High Bar";
            break;
        
            default:
            break;
    }
}

function hideExercise(){
    document.getElementById('EquipmentExercise').style.display="none";
}