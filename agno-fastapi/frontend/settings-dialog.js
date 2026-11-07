"use strict";

/* The Settings dialog (base URL + user id). */

function openSettings() {
    els.baseUrlInput.value = settings.baseUrl;
    els.userIdInput.value = settings.userId;
    els.settingsDialog.showModal();
}

function saveSettings() {
    settings.save(els.baseUrlInput.value.trim(), els.userIdInput.value.trim());
    els.settingsDialog.close();
    startNewChat();
    loadSessions();
}
