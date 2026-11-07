"use strict";

/* Entry point: wire up buttons and start the app. */

function bindEvents() {
    $("new-chat-btn").addEventListener("click", startNewChat);
    $("toggle-sidebar-btn").addEventListener("click", () => els.sidebar.classList.toggle("is-hidden"));
    els.sendBtn.addEventListener("click", sendMessage);
    els.composerInput.addEventListener("input", autosizeComposer);
    els.composerInput.addEventListener("keydown", onComposerKeydown);
    $("settings-btn").addEventListener("click", openSettings);
    $("settings-save-btn").addEventListener("click", saveSettings);
    $("settings-cancel-btn").addEventListener("click", () => els.settingsDialog.close());
}

function init() {
    bindEvents();
    showWelcome();

    if (!settings.userId) {
        openSettings();
        return;
    }
    loadSessions();
}

init();
