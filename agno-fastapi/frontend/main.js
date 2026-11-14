"use strict";

/* Entry point: wire up buttons and start the app. */

function bindEvents() {
    $("new-chat-btn").addEventListener("click", startNewChat);
    $("toggle-sidebar-btn").addEventListener("click", () => els.sidebar.classList.toggle("is-hidden"));
    els.sendBtn.addEventListener("click", sendMessage);
    els.composerInput.addEventListener("input", autosizeComposer);
    els.composerInput.addEventListener("keydown", onComposerKeydown);
    $("logout-btn").addEventListener("click", logout);
    els.authForm.addEventListener("submit", login);
    els.signupBtn.addEventListener("click", signup);
    // The app is useless logged out, so Escape must not dismiss the login dialog.
    els.authDialog.addEventListener("cancel", (e) => e.preventDefault());
}

function init() {
    bindEvents();
    showWelcome();
    handleConnectorRedirect();

    if (!settings.token) {
        openAuth();
        return;
    }
    // If the stored token has expired, this gets a 401 and api.check opens login.
    loadSessions();
    loadConnectors();
}

init();
