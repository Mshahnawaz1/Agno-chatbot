"use strict";

/* Shared app state and DOM references. */

const MOBILE_BREAKPOINT = 700;

const state = {
    sessions: [],
    activeSessionId: null,
    isStreaming: false,
    abortController: null,
};

const $ = (id) => document.getElementById(id);

const els = {
    sidebar: $("sidebar"),
    sessionList: $("session-list"),
    messages: $("messages"),
    chatTitle: $("chat-title"),
    composerInput: $("composer-input"),
    sendBtn: $("send-btn"),
    authDialog: $("auth-dialog"),
    authForm: $("auth-form"),
    authError: $("auth-error"),
    authEmailInput: $("auth-email-input"),
    authPasswordInput: $("auth-password-input"),
    authNameInput: $("auth-name-input"),
    loginBtn: $("login-btn"),
    signupBtn: $("signup-btn"),
};
