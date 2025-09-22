export var truncateAmount = 25;
/* https://stackoverflow.com/a/53637828 */
export function truncateString(str, num) {
    if (str.length > num) {
        return str.slice(0, num) + "...";
    } else {
        return str;
    }
}

export function log(...args) {
    console.log(...args);
    //const format = args.map(arg => typeof arg == "object" ? JSON.stringify(arg) : String(arg)).join(" "); // idk what this is lol
    //window.electronAPI.sendConsoleLog(format);
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