window.onload = checkLoginStatus;


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
        const response = await fetch("http://127.0.0.1:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, password: newPassword })
        });

        const data = await response.json();

        if (response.ok && data.message === "Registrierung erfolgreich!") {
            cancelRegistration();
            document.getElementById("errorMsgRegister").textContent = "";
            clearLoginInput();
        } else {
            document.getElementById("errorMsgRegister").textContent = "Benutzername bereits vergeben!";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("errorMsgRegister").textContent = "Ein unerwarteter Fehler ist aufgetreten!";
    }
}

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

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.message === "Login successful!") {
            localStorage.setItem("user", username);
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



async function logout() {
    const name = localStorage.getItem("user");

    try {
        const response = await fetch("http://127.0.0.1:5000/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name })
        });

        if (!response.ok) {
            throw new Error(`Logout fehlgeschlagen: ${response.status} ${response.statusText}`);
        }

        await response.json();
        localStorage.removeItem("user");
        checkLoginStatus();

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("errorMsg").textContent = "Fehler beim Logout!";
    }
}

