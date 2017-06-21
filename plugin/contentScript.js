"use strict";

class Editor {
    static messageListener(message, sender, callback) {
        switch (message.functiontoInvoke) {
            case "add": Editor.add(); break;
            case "delete": Editor.delete(); break;
            case "replace": Editor.replace(); break;
            case "undo": Editor.undo(); break;
            case "save": Editor.save(); break;
            default: console.log("No match found for command"); break;
        }
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

    static save() {
        let fileName = "EditedWebPage.html";
        let blob = Editor.serializePage();
        Editor.saveOnChrome(blob, fileName);
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

    static serializePage() {
        let docString = [ Editor.fragmentToSave().all[0].outerHTML ];
        return new Blob(docString, {type : 'text/html'});
    }

    static fragmentToSave() {
        let edits = Editor.iterateElements(document.body, 
            e => e.id.startsWith(Editor.driveByEditIdTag)
        );
        let ancestor = document.body;
        if (2 < edits.length) {
            let range = new Range();
            range.setStart(edits[0], 0);
            range.setEnd(edits[edits.length - 1], 0);
            ancestor = range.commonAncestorContainer;
        }
        let newDoc = new DOMParser().parseFromString(
            "<html><head><title></title></head><body></body></html>",
             "text/html"
        );
        Editor.addStyle(newDoc);
        for(let i = 0; i < ancestor.children.length; ++i) {
            newDoc.body.appendChild(ancestor.children[i].cloneNode(true));
        }
        return newDoc;
    }    

    static undoElement(element) {
        switch (element.className) {
            case Editor.labelClassName: element.remove(); break;
            case Editor.addedClassName: element.remove(); break;
            case Editor.deletedClassName: Editor.undoDelete(element); break;
            default: console.log("No match found for command"); break;
        }
    }

    static undoDelete(element) {
        let textNode = element.ownerDocument.createTextNode(element.textContent);
        element.replaceWith(textNode);
    }

    static saveOnChrome(blob, fileName) {
        var clickEvent = new MouseEvent("click", {
            "view": window,
            "bubbles": true,
            "cancelable": false
        });
        var a = document.createElement("a");
        let dataUrl = URL.createObjectURL(blob);
        a.href = dataUrl;
        a.download = fileName;
        a.dispatchEvent(clickEvent);
        Editor.scheduleDataUrlForDisposal(dataUrl);
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

Editor.addStyle(window.document);
chrome.extension.onMessage.addListener(Editor.messageListener);
