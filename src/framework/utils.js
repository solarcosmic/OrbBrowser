/*
 * Orb Browser
 * Copyright (c) 2025 solarcosmic.

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
export var truncateAmount = 25;
/* https://stackoverflow.com/a/53637828 */
export function truncateString(str, num) {
    if (str.length > num) {
        return str.slice(0, num) + "...";
    } else {
        return str;
    }
}

export function createLogger(module) {
    return (...args) => log(module, ...args);
}

export function log(module = "[net.solarcosmic.orbbrowser.main]", ...args) {
    const prefix = `[${module}]:`;
    console.log(prefix, ...args);
    const format = [prefix, ...args].map(arg => typeof arg == "object" ? JSON.stringify(arg) : String(arg)).join(" "); // idk what this is lol
    window.electronAPI.sendConsoleLog(format);
}

/*
 * Changes the title of the window.
 * [title]: string
*/
export function changeWindowTitle(title) {
    const tr = truncateString(title, truncateAmount + 10);
    document.title = (tr + " ⎯ Orb Browser") || "Orb Browser";
}

export function checkOmniFlow() {
    const entry = document.getElementById("omnibox-entry");
    const txt = document.getElementById("url-txt");
    if (txt.scrollWidth > txt.clientWidth) {
        entry.classList.add("fade-overflow");
    } else {
        entry.classList.remove("fade-overflow");
    }
}
export function checkTabTitleFlow() {
    const tabButtons = document.querySelectorAll("#tablist [id^='tab-button-']");
    tabButtons.forEach(button => {
        const title = button.querySelector(".page-title");
        if (title) {
            if (title.scrollWidth > title.clientWidth) {
                button.classList.add("fade-title-overflow");
            } else {
                button.classList.remove("fade-title-overflow");
            }
        }
    });
}