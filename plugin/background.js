"use strict";

function genericOnClick(info, tab) {
    chrome.tabs.sendMessage(tab.id, {
        functiontoInvoke: info.menuItemId
    });
}

let menuItems = [
    {id: "add", title: "Add New Text"},
    {id: "delete", title: "Delete Selected Text"},
    {id: "replace", title: "Replace Selected Text"},
    {id: "undo", title: "Undo last edit", contexts: ["page"]},
    {id: "save", title: "Save changes to file", contexts: ["page"]}
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
