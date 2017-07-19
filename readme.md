# Drive By Editor
(c) 2017 David Teviotdale

A simple Extension for Firefox and Chrome that allows you to mark up proof reading corrections on a web page.

## How to use:
* Browse to Web page with text you want to proof read.
* To Delete text, select the text on the web page, right click, select "Drive By Editor" -> "Delete Selected Text".
* To Add text, select the text on the web page, right click, select "Drive By Editor" -> "Add New Text"  Type new text into the window that appears and click "Apply" button.
* To Replace text, select the text on the web page, right click, select "Drive By Editor" -> "Replace Selected Text"  Type new text into the window that appears and click "Apply" button.
* When done, all the edits can be copied to the clipboard at once. Right click anywhere on page, then select "Drive by Editor" -> "Copy edits to Clipboard".

## How to install
### Firefox
1. Start Firefox
2. Browse to https://addons.mozilla.org/en-GB/firefox/addon/drive-by-editor/?src=ss
3. Click on the "Add to Firefox" button.

## How to install from Source
### Chrome
1. Download the extension. Go to https://github.com/dteviot/DriveByEditor and click on the "Clone or Download" button, then "Download ZIP".
2. Unpack zip file and move the "plugin" directory to the location you want to keep it.
3. Open Chrome and type "chrome://extensions" into the browser.
4. Make sure "Developer Mode" at the top of the page is checked.
5. Press the "Load unpacked extension.." button and browse to the "plugin" directory from step 2.
6. You will need to reload any pages that were opened before the extension was loaded for the extension to work on those pages. 

### Firefox
1. Download the extension. Go to https://github.com/dteviot/DriveByEditor and click on the "Clone or Download" button, then "Download ZIP".
2. Unpack zip file and move the "plugin" directory to the location you want to keep it.
3. Open Firefox and type "about:debugging" into the browser.
4. Click the "Load Temporary Add-on" button.
5. Browse to the "plugin" directory from step 2, select the manifest.json file and click "Open"
6. You will need to reload any pages that were opened before the extension was loaded for the extension to work on those pages. 

## License information
Licenced under GPLv3.
