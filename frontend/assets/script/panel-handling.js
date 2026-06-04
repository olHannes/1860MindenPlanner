
//basic Functions
//////////////////////////////////////////////////////////////
export function show(el, display = "block") {
    if (el) el.style.display = display;
}
export function hide(el) {
    if (el) el.style.display = "none";
}
export function clearHTML(el) {
    if (el) el.innerHTML = "";
}
export function clearValue(el) {
    if (el) el.value = "";
}


export function showLoader(el) {
  if (!el) return;
  el.style.visibility = "visible";
  el.style.pointerEvents = "auto";
  el.style.opacity = "1";
}

export function hideLoader(el) {
  if (!el) return;
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  setTimeout(() => {
    el.style.visibility = "hidden";
  }, 300);
}


export function showFloatingBackground(root) {
    const el = root.getElementById("overlayRoot");
    show(el, "flex");
}
export function hideFloatingBackground(root) {
    const el = root.getElementById("overlayRoot");
    hide(el);
}


//show global Message
//////////////////////////////////////////////////////////////
export function showMessage(root, title, content, { duration = 2000 } = {}) {
  const container = root.querySelector("#messageBox");
  const titleEl   = container?.querySelector("h3");
  const contentEl = container?.querySelector("i");
  if (!container || !titleEl || !contentEl) return;

  titleEl.textContent = title;
  contentEl.textContent = content;

  if (container._hideTimer) {
    clearTimeout(container._hideTimer);
    container._hideTimer = null;
  }
  if (!container._boundHideOnClick) {
    container._boundHideOnClick = () => hide();
    container.addEventListener("click", container._boundHideOnClick, { passive: true });
  }
  container.classList.add("show");
  function hide() {
    container.classList.remove("show");
    if (container._hideTimer) {
      clearTimeout(container._hideTimer);
      container._hideTimer = null;
    }
  }
  container._hideTimer = setTimeout(hide, duration);
}


export function showInlineNotification(field, text, type) {
    if (!field || !type) return;
    field.textContent = text;
    field.classList.toggle("info", type==="info");
    field.classList.toggle("error", type==="error");
}


// different floating panels
//////////////////////////////////////////////////////////////

// start-up Information 
export function showStartupInformation(root) {
    const startupPanel  = root.getElementById("startupInformation");
    const showFlag      = localStorage.getItem("startUpInfo");
    if(showFlag) {
        hideFloatingBackground(root);
        hide(startupPanel);
    } else {
        showFloatingBackground(root);
        show(startupPanel, "flex");
    }
}
export function hideStartupInformation(root) {
    const startupPanel = root.querySelector(".on-top-panel");
    hide(startupPanel);
    hideFloatingBackground(root);
    localStorage.setItem("startUpInfo", false);
    
}



// main Content pages
//////////////////////////////////////////////////////////////
const panelResetters = {
    0: () => {
        hide(document.getElementById("nameEdit"));
        hide(document.getElementById("passwordEdit"));
        hide(document.getElementById("requestDelAcc"));
        show(document.getElementById("nameView"), "block");
    },
    1: () => {
        hide(document.getElementById("elementSelection"));
        hide(document.getElementById("exerciseCreationPanel"));
        hide(document.getElementById("EquipmentExercise"));
        show(document.getElementById("exerciseCreationButtonPanel"), "flex");
    },
    2: () => {
        
    },
};
export function resetPanel(panelId) {
    const id = Number(panelId);
    const fn = panelResetters[id];
    if(!fn) {
        console.warn("Panel-Reset failed:", panelId);
        return;
    }
    fn();
}
export function toggleMainPanel(root, panelId) {
  const panels = [1,2,3,4].map(i => root.getElementById(`panel${i}`));
  const target = root.getElementById(`panel${panelId}`);
  if (!target) return;

  const wasOpen = target.classList.contains("visible");

  panels.forEach(p => p?.classList.remove("visible"));

  if (!wasOpen) {
    resetPanel(panelId);
    target.classList.add("visible");
  }
}

// User Login and Registration
//////////////////////////////////////////////////////////////
export function clearForm(root, inputIds = [], errorId = null) {
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
        if (errorEl) errorEl.classList.toggle("error", false);
        if (errorEl) errorEl.classList.toggle("info", false);
    }
}

// Registration
export function showRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    clearForm(root, ["firstName", "lastName", "newPassword", "confirmPassword"], "errorMsgRegister");
    hide(loginMask);
    show(registrationMask, "block");
}
export function hideRegistration(root) {
    const loginMask = root.getElementById("login_mask");
    const registrationMask = root.getElementById("registration_mask");
    clearForm(root, ["email", "password"], null);
    hide(registrationMask);
    show(loginMask, "block");
}

export function showPasswordForgot(root) {
    const loginMask = root.getElementById("login_mask");
    const pwdMask   = root.getElementById("pwdForgot_mask");
    hide(loginMask);
    show(pwdMask, "block");
}
export function hidePasswordForgot(root) {
    const loginMask = root.getElementById("login_mask");
    const pwdMask   = root.getElementById("pwdForgot_mask");
    hide(pwdMask);
    show(loginMask, "block");
}



// Routine Rating
export function showRating(root) {
    const ratingPanel = root.getElementById("ratingRoutine");
    showFloatingBackground(root);
    show(ratingPanel, "block");
}
export function hideRating(root) {
    const ratingPanel = root.getElementById("ratingRoutine");
    hideFloatingBackground(root);
    hide(ratingPanel);
}
