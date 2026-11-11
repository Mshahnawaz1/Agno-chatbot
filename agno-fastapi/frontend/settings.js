"use strict";

/* Access token stored in localStorage. API calls use relative paths
   because FastAPI serves this frontend from the same origin. */

const settings = {
    get token() {
        return localStorage.getItem("accessToken") || "";
    },

    saveToken(token) {
        localStorage.setItem("accessToken", token);
    },

    clearToken() {
        localStorage.removeItem("accessToken");
    },
};
