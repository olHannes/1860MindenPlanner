//window.onload = checkLoginStatus;

window.onload = function () {
    checkUserStatus();
};


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



async function getAllUser() {
    try {
        const response = await fetch(`http://127.0.0.1:5000/users/getUsers`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Fehler: ${response.status} ${response.statusText}`);
        }

        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

async function showAllUser() {
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';

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
}


var currentDevice = null;

function openExercise(id) {
    document.getElementById('EquipmentExercise').style.display = "block";
    const deviceImage = document.getElementById('DeviceImage');
    const headerDe = document.getElementById('Device-de');
    const headerEn = document.getElementById('Device-en');
    const infoBlock = document.getElementById('infoBlock'); 
    const createRoutineBtn = document.getElementById('createRoutineBtn');

    let deviceData = {};

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


function hideExercise(){
    cancleElementSelection();
    document.getElementById('EquipmentExercise').style.display="none";
    document.getElementById('infoBlock').style.display="block";
    document.getElementById('exerciseCreationPanel').style.display="none";
    document.getElementById('createRoutineBtn').style.display="block";
}

function createRoutine(){
    document.getElementById('infoBlock').style.display="none";
    document.getElementById('createRoutineBtn').style.display="none";
    document.getElementById('elementSelection').style.display="none";
    document.getElementById('exerciseCreationPanel').style.display="block";

}



function selectElement(){
    document.getElementById('elementSelection').style.display="block";
    document.getElementById('add-exercise-btn').style.display="none";   

    getElements(null);
}

function cancleElementSelection(){
    document.getElementById('elementSelection').style.display="none";
    document.getElementById('add-exercise-btn').style.display="block";   
}





async function getElements(group) {
    let device = currentDevice;
    try {
        const url = new URL('http://127.0.0.1:5000/elements/getGroupElements');
        const params = { Device: device, Group: group };

        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url);        
        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Daten: ${response.statusText}`);
        }
        
        const elements = await response.json();
        console.log(elements);
        const container = document.getElementById("elementList");
        container.innerHTML = "";

        elements.forEach(element => {
            const exerciseDiv = document.createElement("div");
            exerciseDiv.classList.add("exercise-item");

            const img = document.createElement("img");
            img.src = element.image_path;
            img.alt = element.bezeichnung;
            img.classList.add("exercise-image");

            const title = document.createElement("p");
            title.textContent = element.bezeichnung;
            title.classList.add("exercise-title");

            exerciseDiv.appendChild(img);
            exerciseDiv.appendChild(title);

            container.appendChild(exerciseDiv);
        });
    } catch (error) {
        console.error("Fehler beim Abrufen der Übungen:", error);
    }
}



