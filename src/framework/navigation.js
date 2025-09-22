import * as tabs from "./tabs.js";
export function checkNavigation(tab) {
    if (!tab.view) return log("Error: No valid tab provided for checkNavigation!");
    var currentTab = tabs.getActiveTab();
    if (!currentTab?.id == tab?.id) return;
    if (tab.view.canGoBack()) {
        document.getElementById("left-nav").classList.remove("greyed-out");
    } else {
        document.getElementById("left-nav").classList.add("greyed-out");
    }
    if (tab.view.canGoForward()) {
        document.getElementById("right-nav").classList.remove("greyed-out");
    } else {
        document.getElementById("right-nav").classList.add("greyed-out");
    }
}

/*
 * Navigates to a specific tab.
 * Defaults to the currently active tab if no tab is provided.
*/
export function navigate(tab = getActiveTab(), direction) {
    if (!tab.view) return;
    if (direction == "back") tab.view.goBack();
    if (direction == "forward") tab.view.goForward();
    if (direction == "refresh") tab.view.reload();
    if (direction == "refreshNoCache") tab.view.reloadIgnoringCache();
}