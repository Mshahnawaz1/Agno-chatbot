"use strict";

/* Entry point: wire up buttons and start the app. */

function bindEvents() {
    $("new-chat-btn").addEventListener("click", startNewChat);
    $("toggle-sidebar-btn").addEventListener("click", () => els.sidebar.classList.toggle("is-hidden"));
    els.sendBtn.addEventListener("click", sendMessage);
    els.composerInput.addEventListener("input", autosizeComposer);
    els.composerInput.addEventListener("keydown", onComposerKeydown);
    $("logout-btn").addEventListener("click", logout);
    $("connectors-btn").addEventListener("click", openConnectorsPage);
    $("skill-dialog-close").addEventListener("click", () => $("skill-dialog").close());
    // Click on the backdrop (outside the dialog box) closes it too.
    $("skill-dialog").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
    });
    window.addEventListener("hashchange", route);
    els.authForm.addEventListener("submit", login);
    els.signupBtn.addEventListener("click", signup);
    // The app is useless logged out, so Escape must not dismiss the login dialog.
    els.authDialog.addEventListener("cancel", (e) => e.preventDefault());
}

function init() {
    bindEvents();
    showWelcome();
    handleConnectorRedirect();
    route(); // chat or connectors page, from the URL hash; loads connectors if needed

    if (!settings.token) {
        openAuth();
        return;
    }
    // If the stored token has expired, this gets a 401 and api.check opens login.
    loadSessions();
}

init();
