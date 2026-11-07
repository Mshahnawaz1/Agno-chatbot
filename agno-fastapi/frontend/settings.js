"use strict";

/* Settings stored in localStorage (API base URL + dev user id). */

const DEFAULT_BASE_URL = "http://localhost:8000";

const settings = {
    get baseUrl() {
        return (localStorage.getItem("baseUrl") || DEFAULT_BASE_URL).replace(/\/$/, "");
    },

    get userId() {
        return localStorage.getItem("userId") || "";
    },

    save(baseUrl, userId) {
        localStorage.setItem("baseUrl", baseUrl);
        localStorage.setItem("userId", userId);
    },
};
