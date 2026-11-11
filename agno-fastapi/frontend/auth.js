"use strict";

/* Login / signup dialog and logout. */

function openAuth(message = "") {
    stopStreaming();
    showAuthError(message);
    els.authPasswordInput.value = "";
    if (!els.authDialog.open) els.authDialog.showModal();
    els.authEmailInput.focus();
}

function showAuthError(message) {
    els.authError.textContent = message;
    els.authError.hidden = !message;
}

function setAuthBusy(busy) {
    els.loginBtn.disabled = busy;
    els.signupBtn.disabled = busy;
}

function readAuthForm() {
    return {
        email: els.authEmailInput.value.trim(),
        password: els.authPasswordInput.value,
        name: els.authNameInput.value.trim(),
    };
}

async function finishLogin(email, password) {
    settings.saveToken(await api.login(email, password));
    els.authPasswordInput.value = "";
    els.authDialog.close();
    startNewChat();
    loadSessions();
}

async function login(event) {
    event?.preventDefault(); // the form's Enter-key submit
    const { email, password } = readAuthForm();
    if (!email || !password) return showAuthError("Enter your email and password.");

    setAuthBusy(true);
    try {
        await finishLogin(email, password);
    } catch (err) {
        showAuthError(err.message);
    } finally {
        setAuthBusy(false);
    }
}

async function signup() {
    const { email, password, name } = readAuthForm();
    if (!email || !password) return showAuthError("Enter an email and a password.");

    setAuthBusy(true);
    try {
        await api.signup(email, password, name);
        await finishLogin(email, password); // signup doesn't return a token, so log straight in
    } catch (err) {
        showAuthError(err.message);
    } finally {
        setAuthBusy(false);
    }
}

function logout() {
    // JWTs are stateless: "logging out" just means forgetting the token.
    settings.clearToken();
    state.sessions = [];
    renderSessions();
    startNewChat();
    openAuth();
}
