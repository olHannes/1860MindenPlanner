//helper functions
///////////////////////////////////////////////////////////////////
function clearForm(root, inputIds = [], errorId = null) {
    if (!root) return;
    inputIds.forEach(id => {
        const el = root.getElementById(id);
        if (el && "value" in el) {
            el.value = "";
        }
    });
    if (errorId) {
        const errorEl = root.getElementById(errorId);
        if (errorEl) errorEl.textContent = "";
    }
}
///////////////////////////////////////////////////////////////////

// User Registration
///////////////////////////////////////////////////////////////////
//handle registration windows
export function showRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    if(!loginMask || !registrationMask) return;
    clearForm(root, ["firstName", "lastName", "newPassword", "confirmPassword"], "errorMsgRegister");
    loginMask.style.display = "none";
    registrationMask.style.display = "block";
}
export function hideRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    if(!loginMask || !registrationMask) return;
    clearForm(root, ["username", "password"], "errorMsg");
    registrationMask.style.display = "none";
    loginMask.style.display = "block";
}

export async function register(root) {
    console.warn("registration not implemented yet");
}

// User Login
///////////////////////////////////////////////////////////////////
export async function login(root) {
    console.warn("login not implemented yet");
}