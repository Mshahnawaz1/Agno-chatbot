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
    settingsDialog: $("settings-dialog"),
    baseUrlInput: $("base-url-input"),
    userIdInput: $("user-id-input"),
};
