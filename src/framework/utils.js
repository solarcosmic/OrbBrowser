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