"use strict";

class Editor {
    static messageListener(message, sender, callback) {
        switch (message.functiontoInvoke) {
            case "add": Editor.add(); break;
            case "delete": Editor.delete(); break;
            case "replace": Editor.replace(); break;
            case "undo": Editor.undo(); break;
            case "copy": Editor.copy(); break;
            default: alert("No match found for command"); break;
        }
    }

    static init() {
        Editor.addStyle(window.document);
        if (Editor.isFirefox()) {
            browser.runtime.onMessage.addListener(Editor.messageListener);
        } else {
            chrome.extension.onMessage.addListener(Editor.messageListener);
        }
    }

    static isFirefox() {
        return typeof(browser) !== "undefined";
    }

    static addStyle(doc) {
        let style = doc.getElementById(Editor.styleElementId);
        if (style == null) {
            style = doc.createElement("style");
            doc.head.appendChild(style);
            style.id = Editor.styleElementId;
            style.innerHTML = 
                "span.old { color: #f00; text-decoration: line-through; }\r\n"+
                "span.new { color: #0f0; font-weight: bold; }";
        }
    }

    static add() {
        let range = window.getSelection().getRangeAt(0);
        let endContainer = range.endContainer;
        if (endContainer.nodeType === Node.TEXT_NODE) {
            let textToSplit = endContainer.textContent;
            let beforeText = document.createTextNode(textToSplit.substring(0, range.endOffset));
            let afterText = document.createTextNode(textToSplit.substring(range.endOffset));
            let addElement = Editor.buildTextAddElement(Editor.createIdForElement());
            let parent = endContainer.parentElement;
            endContainer.replaceWith(afterText);
            parent.insertBefore(beforeText, afterText);
            parent.insertBefore(addElement.span, afterText);
            Editor.addEditLabel(addElement.span, addElement.span.id);
            addElement.input.focus();
        } else {
            alert("Need to select a Text node to insert at");
        }
    }

    static delete() {
        let newNode = window.document.createElement("span");
        newNode.className = Editor.deletedClassName;
        newNode.id = Editor.createIdForElement();
        let range = window.getSelection().getRangeAt(0);
        try {
            range.surroundContents(newNode);
            Editor.addEditLabel(newNode, newNode.id);
            return newNode;
        } catch (error) {
            alert("Unable to modify. " + error);
        }
    }

    static replace() {
        let deleted = Editor.delete();
        let replacement = Editor.buildTextAddElement(deleted.id);
        let parent = deleted.parentElement;
        parent.insertBefore(replacement.span, deleted.nextSibling);
        replacement.input.focus();
    }

    static undo() {
        let id = Editor.mostRecentEditId();
        for(let element of Editor.iterateElements(document.body, e => e.id === id)) {
            Editor.undoElement(element);
        }
    }

    static copy() {
        Editor.copyToClipboard(document);
    }

    static nextSequenceNumber() {
        return Editor.currentSequenceNumber() + 1;
    }

    static buildTextAddElement(id) {
        let doc = window.document;
        let span = doc.createElement("span");
        span.className = Editor.addedClassName;
        span.id = id;
        let input = doc.createElement("input");
        input.type = "text";
        input.placeholder = "Type new text here then click \"Apply\" button"
        let button = doc.createElement("button");
        button.textContent = "Apply";
        button.onclick = () => {
            input.remove();
            button.remove();
            span.textContent = input.value;
        }
        span.appendChild(input);
        span.appendChild(button);
        return { span, input };
    }

    static createIdForElement() {
        return `${Editor.driveByEditIdTag}${Editor.nextSequenceNumber()}`;
    } 

    static mostRecentEditId() {
        return `${Editor.driveByEditIdTag}${Editor.currentSequenceNumber()}`;
    }

    static currentSequenceNumber() {
        return Editor.iterateElements(document.body, e => e.tagName === "SPAN")
           .reduce((prev, curr) => Math.max(prev, Editor.nodeSequenceNumber(curr)), -1);
    }

    static nodeSequenceNumber(node) {
        if (node.id.startsWith(Editor.driveByEditIdTag)) {
            let sequence = node.id.substring(Editor.driveByEditIdTag.length);
            return parseInt(sequence);
        }
        return -1;
    }

    static iterateElements(root, filter, whatToShow = NodeFilter.SHOW_ELEMENT) {
        let iterator = document.createNodeIterator(root,
            whatToShow,
            { acceptNode: filter }
        );
        let elements = [];
        let node = null;
        while ((node = iterator.nextNode()) != null) {
            elements.push(node);
        }
        return elements;        
    }

    static addEditLabel(nextSibling, id) {
        let span = nextSibling.ownerDocument.createElement("span");
        span.className = Editor.labelClassName;
        span.id = id;
        span.textContent = " {(edit)} ";
        nextSibling.parentElement.insertBefore(span, nextSibling);
    }

    static serializeEdits() {
        let text = ""
        let html = ""
        for(let parent of Editor.getParentElementsOfEdits()) {
            let clone = parent.cloneNode(true);
            Editor.addStyleToEditSpan(clone);
            html += clone.outerHTML;
            text += Editor.convertEditParentToText(clone) + "\r\n\r\n";
        }
        return {text: text, html: html};
    }

    static getParentElementsOfEdits() {
        let parents = new Set();
        for(let edit of Editor.iterateElements(document.body, 
            e => e.id.startsWith(Editor.driveByEditIdTag)
        )) {
            parents.add(edit.parentElement);
        }
        return parents;
    }

    static convertEditParentToText(parent) {
        for(let span of Editor.iterateElements(parent, 
            e => e.id.startsWith(Editor.driveByEditIdTag)
        )) {
            switch (span.className) {
                case Editor.addedClassName:
                    Editor.editSpanToText(span, "add", parent);
                    break;
                case Editor.deletedClassName:
                    Editor.editSpanToText(span, "remove", parent);
                    break;
                default: alert("No match found for class"); break;
            }
        }
        return parent.textContent;
    }

    static editSpanToText(span, editDescription, parent) {
        let endText = `{(end ${editDescription})}`;
        let beforeText = document.createTextNode(`{(start ${editDescription})}`);
        let afterText = document.createTextNode(`{(end ${editDescription})}`);
        parent.insertBefore(beforeText, span);
        parent.insertBefore(afterText, span.nextSibling);
    }

    static addStyleToEditSpan(parent) {
        for(let span of Editor.iterateElements(parent, 
            e => e.id.startsWith(Editor.driveByEditIdTag)
        )) {
            switch (span.className) {
                case Editor.labelClassName: span.remove(); break;
                case Editor.addedClassName:
                    span.setAttribute("style", "color: #0f0; font-weight: bold;");
                    break;
                case Editor.deletedClassName:
                    span.setAttribute("style", "color: #f00; text-decoration: line-through;");
                    break;
                default: alert("No match found for class"); break;
            }
        }
    }

    static undoElement(element) {
        switch (element.className) {
            case Editor.labelClassName: element.remove(); break;
            case Editor.addedClassName: element.remove(); break;
            case Editor.deletedClassName: Editor.undoDelete(element); break;
            default: alert("No match found for class"); break;
        }
    }

    static undoDelete(element) {
        let textNode = element.ownerDocument.createTextNode(element.textContent);
        element.replaceWith(textNode);
    }

    static copyToClipboard(doc) {
        doc.addEventListener('copy', Editor.onCopyEvent);
        try {
            let success = doc.execCommand("Copy");
            if (!success) {
                alert("Unable to copy");
            }
        } catch (err) {
            alert("Unable to copy");
            alert(err);
        }
        doc.removeEventListener('copy', Editor.onCopyEvent);
    }

    static onCopyEvent(e) {
        let serialized = Editor.serializeEdits(e.clipboardData);
        e.clipboardData.setData('text/plain', serialized.text);
        e.clipboardData.setData('text/html', serialized.html);
        e.preventDefault(); // We want our data, not data from any selection, to be written to the clipboard
    }

    static scheduleDataUrlForDisposal(dataUrl) {
        // there is no download finished event, so best 
        // we can do is release the URL at arbitary time in future
        let oneMinute = 60 * 1000;
        let disposeUrl = function() { URL.revokeObjectURL(dataUrl); };
        setTimeout(disposeUrl, oneMinute);
    }
}

Editor.styleElementId = "DriveByEditStyle";
Editor.driveByEditIdTag = "DriveByEdit-";
Editor.labelClassName = "editLabel";
Editor.addedClassName = "new";
Editor.deletedClassName = "old";

Editor.init();
