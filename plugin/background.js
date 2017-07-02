"use strict";

function genericOnClick(info, tab) {
    let shim = (typeof(browser) !== "undefined") ? browser : chrome;
    shim.tabs.sendMessage(tab.id, {
        functiontoInvoke: info.menuItemId
    });
}

let menuItems = [
    {id: "add", title: "Add New Text"},
    {id: "delete", title: "Delete Selected Text"},
    {id: "replace", title: "Replace Selected Text"},
    {id: "undo", title: "Undo last edit", contexts: ["page", "selection"]},
    {id: "copy", title: "Copy edits to clipboard", contexts: ["page", "selection"]}
];

for (let i of menuItems) {
    let contexts = i.contexts || ["selection"];
    var id = chrome.contextMenus.create({
        id: i.id,
        title: i.title,
        contexts: contexts,
        onclick: genericOnClick
    });
}
