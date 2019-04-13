/**
 * 
 * @class
 * @classdesc DOM2JsonStruct GUI
 * @author Manuel Blechschmidt <blechschmidt@incentergy.de>
 * @constructor
 * @this {DOM2JsonStructGUI}
 */
var DOM2JsonStructGUI = function(body) {
    this.body = body;
    this.initGUI();
};
/**
 * Init all handlers and elements that we need to show the GUI.
 * 
 * @private
 */
DOM2JsonStructGUI.prototype.initGUI = function() {
    var body = this.body;
    var treeView = document.getElementById("dom2jsonstructgui-tree-view");
    if (treeView) {
        throw new Error(
                "dom2jsonstructgui-tree-view already present. DOM2JsonStructGUI"
                        + " can only be constructed once.");
    }
    // sould the user be allowed to choose
    // another entity for mapping
    this.allowsOtherTemplates = false;
    this.treeView = undefined;
    this.currentElementsOldColor = [];
    this.currentElements = [];
    // the current value type of the selected
    // node
    this.currentValueType = undefined;
    this.totalNumberOfVariables = 1;
    // a variable where the preview Text area is saved
    this.previewTextArea = undefined;
    // the div showing the text area
    this.previewDiv = undefined;
    // a variable where code mirror is saved if available
    this.previewCodeMirror = undefined;

    this.mouseListenerEnabled = true;
    this.mouseListenerDoNotTriggerOnce = false;

    // HashMap that maps the name of the template
    // to divs shown on the site
    // e.g.
    // highlightElementsMap["billingAddress.givenName"] = [<dom>];
    this.highlightElementsMap = {};
    // The elements which were selected for the property
    this.selectedElementsMap = {};
    // saving old values to be able to reset
    this.selectedElementsMapOld = {};
    // The current path to the selected variabled joined with .
    // e.g. billingAddress.givenName
    this.currentSelectedVariable = "";
    this.currentCSSSelector = undefined;
    // the current node in the tree that is selected
    this.selectedNode = undefined;
    this.dom2jsonstructTemplate = undefined;
    // the dom element of the wizard box
    this.wizardBox = undefined;
    // map which maps wizard steps to texts
    this.wizardTexts = {};
    // map which maps the select node id
    // to the __dom2jsonstruct variable
    this.selectNodeId2ValueType = {};

    // a map from node.id to booleans
    // telling the system which nodes to
    // hide
    this.wizardHideMap = {};

    // says if we are currently selecting
    // and array or not
    this.arraySelectionMode = false;

    // the form which is used to send
    // the template to another server
    this.currentSaveForm = undefined;

    // this text will be shown by default
    // when showing collecting trigger
    this.exampleTriggerCollecting = "// The code below is used to identify the summary/review page of your online store\n"
            + "// Here are some examples given but you may also implement your own\n"
            + "// This code will be embedded in a function () { [THE-CODE-BELOW] }\n"
            + "// ---- BEGIN MAGENTO 1.7 ----\n"
            + "// If you are using magento 1.7 please uncomment the next 14 lines\n"
            + "// This will hook the Incentergy tracking process into Magento one page checkout\n"
            + "// var incentergyEnabled = false;"
            + "// var incentergyTracking = function() {\n"
            + "//    if(!incentergyEnabled && typeof Review != \"undefined\" && Review.prototype && Review.prototype.initialize) {\n"
            + "//        var __incentergyReviewSuperInitialize = Review.prototype.initialize;\n"
            + "//        Review.prototype.initialize = function (saveUrl, successUrl, agreementsForm) {\n"
            + "//            window.__IncentergyOrderTracking.collectAndSendNow();\n"
            + "//            __incentergyReviewSuperInitialize.call(this, saveUrl, successUrl, agreementsForm);\n"
            + "//            incentergyEnabled = true;\n"
            + "//        }\n"
            + "//    }\n"
            + "//};\n"
            + "// incentergyTracking();\n"
            + "//document.observe(\"dom:loaded\", incentergyTracking);\n"
            + "//return false;\n"
            + "// ---- END MAGENTO 1.7 ----\n"
            + "// ---- BEGIN DEMANDWARE SITE GENESIS 2.0 ----\n"
            + "//return \"__IncentergySizzle\" in window ? window.__IncentergySizzle(\".order-totals\").length > 0 : false;\n"
            + "// ---- END DEMANDWARE SITE GENESIS 2.0 ----\n"
            + "// If you have a sophisticated AJAX checkout. Please implement your trickering logic here\n"
            + "// By default do not start collecting values\n"
            + "return false;";

    /**
     * :: cookies.js ::
     * 
     * A complete cookies reader/writer framework with full unicode support.
     * 
     * https://developer.mozilla.org/en-US/docs/DOM/document.cookie
     * 
     * Syntaxes: * docCookies.setItem(name, value[, end[, path[, domain[,
     * secure]]]]) * docCookies.getItem(name) * docCookies.removeItem(name[,
     * path]) * docCookies.hasItem(name) * docCookies.keys()
     * 
     */

    this.docCookies = {
        getItem : function(sKey) {
            if (!sKey || !this.hasItem(sKey)) {
                return null;
            }
            return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)"
                    + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&")
                    + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
        },
        setItem : function(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
            if (!sKey
                    || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
                return;
            }
            var sExpires = "";
            if (vEnd) {
                switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Tue, 19 Jan 2038 03:14:07 GMT"
                            : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toGMTString();
                    break;
                }
            }
            document.cookie = escape(sKey) + "=" + escape(sValue) + sExpires
                    + (sDomain ? "; domain=" + sDomain : "")
                    + (sPath ? "; path=" + sPath : "")
                    + (bSecure ? "; secure" : "");
        },
        removeItem : function(sKey, sPath) {
            if (!sKey || !this.hasItem(sKey)) {
                return;
            }
            document.cookie = escape(sKey)
                    + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                    + (sPath ? "; path=" + sPath : "");
        },
        hasItem : function(sKey) {
            return (new RegExp("(?:^|;\\s*)"
                    + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\="))
                    .test(document.cookie);
        },
        keys : /* optional method: you can safely remove it! */function() {
            var aKeys = document.cookie.replace(
                    /((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g,
                    "").split(/\s*(?:\=[^;]*)?;\s*/);
            for ( var nIdx = 0; nIdx < aKeys.length; nIdx++) {
                aKeys[nIdx] = unescape(aKeys[nIdx]);
            }
            return aKeys;
        }
    };

    this.initSelectorDisplay();

    var me = this;

    this.onMouseMoveHandler = function(event) {
        me.onMouseMove(event);
    };

    this.onMouseClickHandler = function(event) {
        me.onMouseClick(event);
    };

    if (body.addEventListener) { // all browsers except IE before version 9
        body.addEventListener("mousemove", this.onMouseMoveHandler, false);
        body.addEventListener("click", this.onMouseClickHandler, false);
    } else {
        if (body.attachEvent) { // IE before version 9
            body.attachEvent("mousemove", this.onMouseMoveHandler);
            body.attachEvent("click", this.onMouseClickHandler);
        }
    }

    // when escape is pressed
    var escapeHandler = function(evt) {
        evt = evt || window.event;
        if (evt.keyCode == 27) {
            // if preview is shown
            // only close preview
            if (me.previewDiv) {
                me.clearPreviewDiv();
                this.currentValueType = undefined;
                // afterwards remove all after asking
            } else {
                if (confirm("Do you want to quit mapping mode?")) {
                    me.removeGUI();
                    document.onkeydown = null;
                }
            }
        }
    };

    document.onkeydown = escapeHandler;
};
/**
 * Clear preview div
 */
DOM2JsonStructGUI.prototype.clearPreviewDiv = function() {
    if (this.previewDiv) {
        jQuery(this.previewDiv).remove();
        this.previewDiv = undefined;
        this.previewTextArea = undefined;
    }
};
/**
 * Inits the selector display by adding a div box and an input field to the dom.
 * 
 * @private
 */
DOM2JsonStructGUI.prototype.initSelectorDisplay = function() {
    var body = this.body;
    this.selectorTextDiv = document.createElement("div");
    this.selectorTextDiv.id = "dom2jsonstructgui-selector-div";
    this.selectorTextDiv.style.zIndex = 20;
    this.selectorTextDiv.style.fontFamily = "sans-serif";
    if ("boxShadow" in this.selectorTextDiv.style) {
        this.selectorTextDiv.style.boxShadow = "0 0 10px #9999FF";
    }
    this.displayOn(this.selectorTextDiv, "right", "bottom");

    var previewButton = document.createElement("button");
    var previewButtonText = document.createTextNode("Preview JSON");
    previewButton.appendChild(previewButtonText);
    previewButton.id = "dom2jsonstructgui-preview-button";
    previewButton.type = "button";
    previewButton.style.marginRight = "15px";

    var previewTemplateButton = document.createElement("button");
    var previewTemplateButtonText = document.createTextNode("Preview Template");
    previewTemplateButton.appendChild(previewTemplateButtonText);
    previewTemplateButton.id = "dom2jsonstructgui-preview-template-button";
    previewTemplateButton.type = "button";
    previewTemplateButton.style.marginRight = "15px";

    var me = this;

    jQuery(previewTemplateButton)
            .click(
                    function(e) {
                        if (me.dom2jsonstructTemplate) {
                            me.showTextInPreview(me.getJSONTemplate());
                        } else {
                            alert("me.dom2jsonstructTemplate is undefined. Please load a template.");
                        }
                    });

    this.selectorTextDiv.appendChild(previewTemplateButton);

    jQuery(previewButton)
            .click(
                    function(e) {
                        if (me.dom2jsonstructTemplate) {
                            var dom2json = new DOM2JsonStruct(document);
                            var outputList = dom2json
                                    .collectDataForTemplateFromString(me
                                            .getJSONTemplate(), true);
                            delete outputList.toString;
                            me.showTextInPreview(JSON.stringify(outputList),
                                    true);
                        } else {
                            alert("me.dom2jsonstructTemplate is undefined. Please load a template.");
                        }
                    });

    this.selectorTextDiv.appendChild(previewButton);

    var saveButton = document.createElement("button");
    var saveButtonText = document.createTextNode("Save Tracking Binding");
    saveButton.appendChild(saveButtonText);
    saveButton.id = "dom2jsonstructgui-save-button";
    saveButton.type = "button";
    saveButton.style.marginRight = "15px";

    this.selectorTextDiv.appendChild(saveButton);

    var me = this;
    jQuery(saveButton).click(function(e) {
        me.saveTemplate();
    });

    this.selectorInput = document.createElement("input");
    this.selectorInput.id = "dom2jsonstructgui-selector-input";
    this.selectorInput.style.border = "solid black 1px";
    this.selectorInput.style.width = "400px";

    jQuery(this.selectorInput).click(function(e) {
        // do not continue throwing this event
        // this will prevent the mouse click handler
        e.preventDefault();
    });
    jQuery(this.selectorInput).focus(function() {
        me.unhighliteElements();
        me.mouseListenerEnabled = false;
    });
    jQuery(this.selectorInput).blur(function(e) {
        // do not continue throwing this event
        // this will prevent the mouse click handler
        me.mouseListenerDoNotTriggerOnce = true;
        me.mouseListenerEnabled = true;
    });
    jQuery(this.selectorInput).keyup(function() {
        me.currentCSSSelector = this.value;
        try {
            var activeElements = jQuery(me.currentCSSSelector);
            this.style.backgroundColor = "#fff";
            if (activeElements.length > 0) {
                me.highliteElements(activeElements, false);
                me.updateSelectorForCurrentNode(false);
            }
            // syntax error in CSS selector
        } catch (e) {
            this.style.backgroundColor = "#fcc";
        }

    });
    this.selectorTextDiv.appendChild(this.selectorInput);

    body.appendChild(this.selectorTextDiv);
};
/**
 * This functions shows the given text in a textarea placed directly on the
 * screen
 * 
 * @param textToShow
 *                {string} The text to show.
 * @param beautify
 *                {boolean} should the json string be beautified
 * @private
 */
DOM2JsonStructGUI.prototype.showTextInPreview = function(textToShow, beautify) {
    this.generateAndCleanPreviewDiv();
    this.makeSexyElement(this.previewDiv);
    // this removes functions from JavaScript Objects to only use
    // it for JSON
    if (textToShow && beautify) {
        try {
            var evaluatedObject = eval('(' + textToShow + ')');
            // beautfiy text to show
            textToShow = JSON.stringify(evaluatedObject, null, 4);
        } catch (e) {
            // problem during parsing
        }
    }
    jQuery(this.previewDiv).css({
        "width" : "38%",
        "height" : "60%",
        "position" : "fixed",
        "top" : "20%",
        "left" : "30%"
    });

    this.previewTextArea = document.createElement("textarea");
    this.previewTextArea.id = "dom2jsonstructgui-preview-textarea";
    this.previewTextArea.style.zIndex = 21;
    this.previewTextArea.style.width = "500px";
    this.previewTextArea.style.height = "400px";

    var textNode = document.createTextNode(textToShow);

    this.previewTextArea.appendChild(textNode);
    this.previewDiv.appendChild(this.previewTextArea);

    if ("CodeMirror" in window) {
        this.previewCodeMirror = CodeMirror.fromTextArea(this.previewTextArea,
                {
                    mode : "javascript",
                    lineNumbers : true,
                    lineWrapping : true
                });
    }
};
/**
 * Generate a preview div if it does not exists yet and place it in the middle
 * pf the screen.
 */
DOM2JsonStructGUI.prototype.generateAndCleanPreviewDiv = function() {
    if (!this.previewDiv) {
        this.previewDiv = document.createElement("div");

        this.previewDiv.id = "dom2jsonstructgui-preview-div";
        this.previewDiv.style.width = "500px";
        this.previewDiv.style.height = "400px";
        this.previewDiv.style.zIndex = 10;

        var $previewDiv = jQuery(this.previewDiv);
        $previewDiv.css("position", "absolute");
        var outerHeight = $previewDiv.outerHeight();
        var outerWidth = $previewDiv.outerWidth();
        $previewDiv.css("top", Math.max(0,
                ((jQuery(window).height() - outerHeight) / 2)
                        + jQuery(window).scrollTop())
                + "px");
        $previewDiv.css("left", Math.max(0,
                ((jQuery(window).width() - outerWidth) / 2)
                        + jQuery(window).scrollLeft())
                + "px");

        document.body.appendChild(this.previewDiv);
    }

    while (this.previewDiv.firstChild) {
        this.previewDiv.removeChild(this.previewDiv.firstChild);
    }
};
/**
 * This function saves the template by sending it via post to an iframe and the
 * iframe shows the result of the action.
 */
DOM2JsonStructGUI.prototype.saveTemplate = function() {
    var template = this.dom2jsonstructTemplate;
    var rootDom2jsonstructInfo = undefined;
    if (this.isArray(template) && template.length > 0
            && "__dom2jsonstruct" in template[0]) {
        rootDom2jsonstructInfo = template[0]["__dom2jsonstruct"];
    } else if ("__dom2jsonstruct" in template) {
        rootDom2jsonstructInfo = template["__dom2jsonstruct"];
    }
    if (rootDom2jsonstructInfo != undefined
            && "saveSelfURL" in rootDom2jsonstructInfo) {
        var jsonTemplateString = this.getJSONTemplate();
        var saveSelfURL = rootDom2jsonstructInfo["saveSelfURL"];

        this.generateAndCleanPreviewDiv();

        var div = document.createElement('div');
        // this will make sure that we authorize before submitting the form
        div.innerHTML = '<iframe height="400" width="500" src="'
                + saveSelfURL
                + '" name="dom2jsonstructgui-iframe-for-save" style="background-color: white"></iframe>';
        this.previewDiv.appendChild(div);

        this.currentSaveForm = document.createElement('form');
        document.body.appendChild(this.currentSaveForm);
        this.currentSaveForm.setAttribute('action', saveSelfURL);
        this.currentSaveForm.setAttribute('method', 'POST');
        this.currentSaveForm.setAttribute('target',
                'dom2jsonstructgui-iframe-for-save');

        var params = {
            "jsonStructTemplate" : '{"content" : '
                    + JSON.stringify(jsonTemplateString, null, 4) + '}'
        };

        for (param in params) {
            var field = document.createElement('input');
            field.setAttribute('type', 'hidden');
            field.setAttribute('name', param);
            field.setAttribute('value', params[param]);
            this.currentSaveForm.appendChild(field);
        }

        var submit = document.createElement('input');
        submit.setAttribute('type', 'submit');
        submit.setAttribute('name', 'hidden-submit');
        submit.setAttribute('value', 'submit');
        submit.style.display = 'none';
        this.currentSaveForm.appendChild(submit);

        this.currentSaveForm.submit();

        document.body.removeChild(this.currentSaveForm);
        this.currentSaveForm = undefined;

    } else {
        // initialize __dom2jsonstruct in root
        if (this.isArray(template) && template.length > 0
                && !("__dom2jsonstruct" in template[0])) {
            template[0]["__dom2jsonstruct"] = {};
        } else if (!("__dom2jsonstruct" in template)) {
            template["__dom2jsonstruct"] = {};
        }
        template["__dom2jsonstruct"]["saveSelfURL"] = prompt("No saveSelfURL given in the current template. Please specify it.");
        if (template["__dom2jsonstruct"]["saveSelfURL"]) {
            this.saveTemplate();
        }
    }
};
/**
 * This function generates a color which tries to be in contrast to the other
 * color. It uses HSV and divides the color cycle into equal parts.
 * {@link http://stackoverflow.com/questions/6823286/create-unique-colors-using-javascript}
 * {@link http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript}
 * 
 * @param total
 *                {number} the maximum of colors in this session
 * @param n
 *                {number} the current color requested
 */
DOM2JsonStructGUI.prototype.getColor = function(total, n) {
    var degrees = 360 / (total - 1); // distribute the colors evenly on the
    // hue range
    var h = (degrees * n) / 360;
    var s = 100 / 100;
    var v = 100 / 100;
    var r = undefined, g = undefined, b = undefined;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
    case 0:
        r = v, g = t, b = p;
        break;
    case 1:
        r = q, g = v, b = p;
        break;
    case 2:
        r = p, g = v, b = t;
        break;
    case 3:
        r = p, g = q, b = v;
        break;
    case 4:
        r = t, g = p, b = v;
        break;
    case 5:
        r = v, g = p, b = q;
        break;
    }

    var rString = ((r * 255) < 16 ? "0" : "")
            + Math.round(r * 255).toString(16);
    var gString = ((g * 255) < 16 ? "0" : "")
            + Math.round(g * 255).toString(16);
    var bString = ((b * 255) < 16 ? "0" : "")
            + Math.round(b * 255).toString(16);

    var stringColor = "#" + rString + gString + bString;
    return stringColor;
};
/**
 * Return the currently selected node.
 */
DOM2JsonStructGUI.prototype.getSelectedNode = function() {
    return this.selectedNode;
};
/**
 * Sets the necessary style properties on an element to display it fixed on the
 * bottom on the browser.
 * 
 * @param el
 *                {Element} The node to place at the bottom
 * @param side
 *                {string} the side (left, right)
 * @param orientation
 *                {string} bottom or top
 */
DOM2JsonStructGUI.prototype.displayOn = function(el, side, orientation) {
    el.style.position = "fixed";
    el.style[orientation] = "10px";
    el.style[side] = "10px";
    this.makeSexyElement(el);
};
/**
 * This functions styles an element
 * 
 * @param el
 *                {Element} th element to style
 */
DOM2JsonStructGUI.prototype.makeSexyElement = function(el) {
    el.style.border = "solid black 1px";
    el.style.fontSize = "18px";
    el.style.padding = "10px";
    el.style.backgroundColor = "#fff";
    // cool browsers
    el.style.backgroundColor = "rgba(255, 255, 255, 0.8)";

    if ("boxShadow" in el.style) {
        el.style.boxShadow = "0 0 10px #9999FF";
    }

    if (el.tagName == "FORM") {
        el.style.display = 'block';
    }
};
/**
 * This function will remove and reset all divs and settings which were created
 * to show this GUI.
 */
DOM2JsonStructGUI.prototype.removeGUI = function() {
    // unhighlight current highlighted events
    this.unhighliteElements();

    // remove small labels
    for ( var i in this.highlightElementsMap) {
        for ( var j = 0; j < this.highlightElementsMap[i].length; j++) {
            if (typeof this.highlightElementsMap[i][j] == "object"
                    && "remove" in this.highlightElementsMap[i][j]) {
                this.highlightElementsMap[i][j].remove();
            }
        }
    }
    // remove outline from elements
    for ( var i in this.selectedElementsMap) {
        for ( var j = 0; j < this.selectedElementsMap[i].length; j++) {
            if (i in this.selectedElementsMapOld
                    && j in this.selectedElementsMapOld[i]) {
                // BUG: if an element was selected twice this
                // will only reset it once
                // Workaround: just set the outline to nothing
                jQuery(this.selectedElementsMap[i][j]).css("outline", "");
                // this.selectedElementsMapOld[i][j]
            }
        }
    }

    // remove the event listener
    if (document.body.removeEventListener) {
        document.body.removeEventListener("mousemove", this.onMouseMoveHandler,
                false);
        document.body.removeEventListener("click", this.onMouseClickHandler,
                false);
    } else {
        document.body.detachEvent("mousemove", this.onMouseMoveHandler);
        document.body.detachEvent("click", this.onMouseClickHandler);
    }
    if (this.selectorTextDiv) {
        // remove the div for displaying css selector
        jQuery(this.selectorTextDiv).remove();
        this.selectorTextDiv = undefined;
        this.selectorInput = undefined;
    }

    if (this.treeView) {
        // remove the div for displaying css selector
        jQuery(this.treeView).remove();
        this.treeView = undefined;
    }
    if (this.wizardBox) {
        jQuery(this.wizardBox).remove();
        this.wizardBox = undefined;
    }

    this.clearPreviewDiv();

    if (this.currentSaveForm) {
        jQuery(this.currentSaveForm).remove();
        this.currentSaveForm = undefined;
    }

    this.currentCSSSelector = undefined;
    this.wizardTexts = {};
    this.selectNodeId2ValueType = {};
    this.wizardHideMap = {};
    this.currentValueType = undefined;
    this.selectedNode = undefined;
};
/**
 * Functions that highlites the given elements.
 * 
 * @private
 * @param activeElements
 *                {objects} the elements to highlite
 * @param mark
 *                {boolean} mark the objects in read background
 */
DOM2JsonStructGUI.prototype.highliteElements = function(activeElements, mark) {
    var me = this;
    activeElements.each(function(index, el) {
        var $el = jQuery(el);
        me.currentElementsOldColor.push($el.css("background-color"));
        me.currentElements.push($el);
        if (mark) {
            $el.css("background-color", "#f99");
            // cool browsers
            $el.css("background-color", "rgba(255, 120, 120, 0.8)");
        }
    });
};
/**
 * function that unhighlites currently highlited elements.
 * 
 * @private
 */
DOM2JsonStructGUI.prototype.unhighliteElements = function() {
    var me = this;
    // reset the currently colored element
    if (this.currentElements.length > 0) {
        this.currentElements.each(function(i, value) {
            jQuery(value)
                    .css("background-color", me.currentElementsOldColor[i]);
        });
    }
    this.currentElements = jQuery();
    this.currentElementsOldColor = [];
};
/**
 * Function which handles what happens when the mouse moves.
 * 
 * @private
 * @param event
 *                {object} event which is thrown when the mouse moves
 */
DOM2JsonStructGUI.prototype.onMouseMove = function(event) {
    if (this.mouseListenerEnabled) {
        var x = event.clientX, y = event.clientY, elementMouseIsOver = document
                .elementFromPoint(x, y);

        var activeElements = [];

        if (elementMouseIsOver && !this.isSystemElement(elementMouseIsOver)) {
            if (!this.arraySelectionMode) {
                activeElements = jQuery(elementMouseIsOver);
            } else {
                activeElements = jQuery(this.getSelectorFromElement(
                        elementMouseIsOver, true));
            }
            this.unhighliteElements();
            this.highliteElements(activeElements, true);
            var currentCSSSelector = this.getSelectorFromElement(
                    elementMouseIsOver, this.arraySelectionMode);
            this.currentCSSSelector = currentCSSSelector;
            // reset the background to white, just in case it was marked as
            // invalid
            jQuery(this.selectorInput).css("backgroundColor", "#fff");
            this.selectorInput.value = currentCSSSelector;
            // we are hovering the mouse over the tree or over the
            // css input
        } else {
            // get the current selected node
            this.selectedNode = jQuery(this.treeView).tree('getSelectedNode');
            // if there is a selected node
            if (this.selectedNode) {
                // get the selector for this node
                var selectorInTemplate = this.getSelectorInTemplate();
                // if there is a selector
                if (selectorInTemplate) {
                    // show the selector of the currently selected node
                    this.selectorInput.value = selectorInTemplate;
                }
            }
            this.currentCSSSelector = undefined;
        }
    }
};
/**
 * This function adds the current selector to the current selected node in the
 * treeView.
 * 
 * @private
 * @param event
 *                {object} event which is thrown when the mouse is clicked
 */
DOM2JsonStructGUI.prototype.onMouseClick = function(event) {
    if (this.currentElements != undefined && "each" in this.currentElements) {
        // if one of the currentElements contain an A tag
        this.currentElements.each(function(index, el) {
            // do not bubble the event to an A tag which might
            // take the user somewhere else
            if (el != undefined && index in el && el[index].tagName == "A") {
                event.preventDefault();
            }
        });
    }

    if (!this.mouseListenerDoNotTriggerOnce) {
        this.updateSelectorForCurrentNode(true);
    } else {
        this.mouseListenerDoNotTriggerOnce = false;
    }
};
/**
 * Update the css selector for the currently selected node.
 * 
 * @param nextStep
 *                {boolean} should the wizard go to the next step
 * @private
 */
DOM2JsonStructGUI.prototype.updateSelectorForCurrentNode = function(nextStep) {
    // if the treeView is available and there is a current selector
    // and the selector returns elements
    if (this.treeView && this.currentCSSSelector
            && jQuery(this.currentCSSSelector).length > 0) {
        // do not execute click on a link
        // event.preventDefault();
        this.selectedNode = jQuery(this.treeView).tree('getSelectedNode');
        if (this.selectedNode) {
            var nodeLabel = jQuery(this.selectedNode.element).find("span");
            this.setSelectorInTemplate();
            nodeLabel.text(this.selectedNode.name + " ("
                    + this.elements2String(this.currentElements) + ")");
            nodeLabel.css("color", this.getColor(
                    this.totalNumberOfVariables - 1, this.selectedNode.id));

            var currentElementsForAfterSelect = this.currentElements;

            if (this.currentSelectedVariable != "") {
                // mark the current elements as assigned to a variable
                this.setHighliteLabels(this.currentSelectedVariable,
                        this.currentElements, this.selectedNode);
            }
            // if we have a specific valueType
            // search for a callback
            if (this.currentValueType) {
                if ("valueTypeAfterSelect" + this.currentValueType in this) {
                    try {
                        this["valueTypeAfterSelect" + this.currentValueType](
                                this.selectedNode,
                                currentElementsForAfterSelect);
                    } catch (e) {
                        alert(e);
                    }
                } else {
                    throw this.currentValueType + " not supported";
                }
                this.currentValueType = undefined;
            }

            // if this is running in wizard mode
            // select the next wizard step
            if (this.wizardBox && nextStep) {
                this.selectWizardStep(this.selectedNode.id + 1, true);
            }
        } else {
            alert("Please select a property in the tree view to bind this field.");
        }
    }
};
/**
 * This function generates small black lables to indicate which elements are
 * part of a certain mapping. Further it generates a colorful outline to
 * distinguish between different variables.
 * 
 * @private
 */
DOM2JsonStructGUI.prototype.setHighliteLabels = function(variableName,
        currentElements, selectedNode) {

    var highlightElements = [];
    var oldOutlines = [];
    var me = this;
    // unhighlite elements if any are available
    if (this.highlightElementsMap[variableName]
            && "length" in this.highlightElementsMap[variableName]) {
        // in case there are already bindings
        // remove them
        for ( var i = 0; i < this.highlightElementsMap[variableName].length; i++) {
            jQuery(this.highlightElementsMap[variableName][i]).remove();
            jQuery(this.selectedElementsMap[variableName][i]).css("outline",
                    this.selectedElementsMapOld[variableName][0]);
        }
    }

    currentElements.each(function(index, el) {
        var $el = jQuery(el);
        oldOutlines.push($el.css("outline"));
        var outlineColor = me.getColor(me.totalNumberOfVariables - 1,
                selectedNode.id);
        $el.css("outline", outlineColor + " dotted 3px");
        var elementLabel = jQuery('<div id="dom2jsonstructgui-' + Math.random()
                + '">' + variableName + '</div>');
        elementLabel.css({
            "position" : "absolute",
            "left" : $el.offset().left,
            "top" : $el.offset().top + $el.outerHeight(true) - 14,
            "font-size" : "10px",
            "font-family" : "sans-serif",
            "color" : "#fff",
            // "width" : $el.outerWidth(true),
            "height" : "14px",
            "background-color" : "rgba(40, 40, 40, 0.5)"
        });
        elementLabel.appendTo(document.body);
        elementLabel.click(function() {
            $el.click();
        });
        highlightElements.push(elementLabel);
    });

    this.highlightElementsMap[variableName] = highlightElements;
    this.selectedElementsMap[variableName] = currentElements;
    this.selectedElementsMapOld[variableName] = oldOutlines;
    this.unhighliteElements();
};
/**
 * Converts the given elements to a string.
 * 
 * @parem elements {Array} a list of elements
 * @param preSetProcessing
 *                {function} a list which is applied before setting value
 */
DOM2JsonStructGUI.prototype.elements2String = function(elements,
        preSetProcessing) {
    var elementString = [];

    elements
            .each(function(i, value) {
                // unwrap value from jQuery list
                if (typeof value === "object" && "0" in value) {
                    value = value[0];
                }

                var valueToSet = typeof preSetProcessing == "function" ? preSetProcessing(value)
                        : (typeof value == "object" && "innerHTML" in value ? value.innerHTML
                                : value);
                elementString.push(valueToSet);
            });
    var s = elementString.join(", ");
    // if string is longer then 25 characters
    if (s.length > 25) {
        // only return first 25 characters
        s = s.slice(0, 25) + "...";
    }
    return s;
};
/**
 * This function sets the css selector in our internal template representation
 * based on the givenNode.
 * 
 * @private
 */
DOM2JsonStructGUI.prototype.setSelectorInTemplate = function() {
    this.setPropertyInTemplate("selector", this.currentCSSSelector);
};
/**
 * This function sets the given property to the given value in our internal
 * template representation based on the givenNode.
 * 
 * @param property
 *                {String} the property to set
 * @param value
 *                {String} the value to set
 * @private
 */

DOM2JsonStructGUI.prototype.setPropertyInTemplate = function(property, value,
        selectedNode) {
    var path = this.getPathNamesToNode(selectedNode != undefined ? selectedNode
            : this.selectedNode);
    var pointer = this.dom2jsonstructTemplate;
    // go throug the template and find the property
    // we want to bind
    for ( var part = 0; part < path.length; part++) {
        // there are more parts in path when prototype is loaded
        // as well like each and eachSlice ...
        // make sure that these are ignored
        if (path[part] in pointer) {
            pointer = pointer[path[part]];
        }
    }
    // if we do not have the __dom2jsonstruct
    // yet create it
    if (!("__dom2jsonstruct" in pointer)) {
        pointer["__dom2jsonstruct"] = {};
    }
    pointer["__dom2jsonstruct"][property] = value;
};
/**
 * This function gets the css selector in our internal template representation
 * based on the givenNode.
 * 
 * @private
 */
DOM2JsonStructGUI.prototype.getSelectorInTemplate = function() {
    var path = this.getPathNamesToNode();
    var pointer = this.dom2jsonstructTemplate;
    // go throug the template and find the property
    // we want to bind
    for ( var part = 0; part < path.length; part++) {
        // there are more parts in path when prototype is loaded
        // as well like each and eachSlice ...
        // make sure that these are ignored
        if (path[part] in pointer) {
            pointer = pointer[path[part]];
        }
    }
    // return the selector if defined
    if ("__dom2jsonstruct" in pointer
            && "selector" in pointer["__dom2jsonstruct"]) {
        return pointer["__dom2jsonstruct"]["selector"];
    }
    // if no selector is defined just return undefined
    return undefined;
};
/**
 * Climbs up the object tree to get to the root during doing this the label of
 * the node is prepended to a list.
 * 
 * @return {Array} path to the selectedNode
 */
DOM2JsonStructGUI.prototype.getPathNamesToNode = function(selectedNode) {
    selectedNode = selectedNode == undefined ? this.selectedNode : selectedNode;
    var path = [];
    // while there is still parent object
    while (selectedNode.parent != undefined) {
        // prepend the current node name at the beging of the
        // path
        path.unshift(selectedNode.name);
        selectedNode = selectedNode.parent;
    }
    return path;
};
/**
 * Returns the CSS selector of the element. This is needed to later show the
 * element again to the people on this element.
 * 
 * @param el
 *                the element to search
 * @param arrayMode
 *                should the selector return multiple elements?
 * @return the css selector
 */
DOM2JsonStructGUI.prototype.getSelectorFromElement = function(el, arrayMode) {
    arrayMode = typeof arrayMode !== 'undefined' ? arrayMode : false;
    var names = [];
    var removedNthChild = false;
    var listElements = {
        "TR" : true,
        "LI" : true
    };
    while (el.parentNode && el.parentNode.nodeName != "#document") {
        if (el.id) {
            names.unshift('#' + el.id);
            break;
        } else {
            if (el == el.ownerDocument.documentElement) {
                names.unshift(el.tagName);
            } else {
                // removed nth-child for first appereance of LIST element
                if (arrayMode && !removedNthChild && listElements[el.tagName]) {
                    names.unshift(el.tagName);
                    removedNthChild = true;
                } else {
                    for ( var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++)
                        ;
                    names.unshift(el.tagName + ":nth-child(" + c + ")");
                }
            }
            el = el.parentNode;
        }
    }
    return names.join(" > ");
};

/**
 * Returns true if it is a system element and shouldn't be highlitted.
 * 
 * @param el
 *                the element to search
 * @return {boolean} true if it is a system element
 */
DOM2JsonStructGUI.prototype.isSystemElement = function(el) {
    while (el.parentNode && el.parentNode.nodeName != "#document") {
        if (el.id && el.id.match(/^dom2jsonstructgui-/)) {
            return true;
        }
        el = el.parentNode;
    }
    return false;
};

/**
 * Initiates and populates a tree based on a template in the DOM2JsonStruct
 * format.
 * 
 * @param template
 *                {object} JSON Template of DOM2JsonStruct
 */
DOM2JsonStructGUI.prototype.populateTreeFromTemplate = function(template) {
    // makge sure that we have a working GUI
    this.removeGUI();
    this.initGUI();

    this.dom2jsonstructTemplate = template;
    var treeView = document.getElementById("dom2jsonstructgui-tree-view");
    if (!treeView) {
        treeView = document.createElement("div");
        treeView.id = 'dom2jsonstructgui-tree-view';
        treeView.style.width = "350px";
        treeView.style.textAlign = "left";
        treeView.style.fontFamily = "sans-serif";
        treeView.style.maxHeight = "600px";
        treeView.style.overflow = "auto";
        treeView.style.zIndex = 20;
        if ("boxShadow" in treeView.style) {
            treeView.style.boxShadow = "0 0 10px #9999FF";
        }
        document.body.appendChild(treeView);
        this.displayOn(treeView, "left", "bottom");
    }
    this.totalNumberOfVariables = 1;
    var treeData = this.convertTemplateToJQFormat(template, []);
    var me = this;
    jQuery(treeView).tree(
            {
                data : treeData,
                // only leaves are selectable
                onCanSelectNode : function(node) {
                    if (node != undefined && node.children.length == 0) {
                        // Nodes without children can be selected
                        return true;
                    } else {
                        // Nodes with children cannot be selected
                        return false;
                    }
                },
                onCreateLi : function(node, $li) {
                    // if we already have a selector for the li
                    if ("selector" in node) {
                        var currentElements = jQuery(node.selector);
                        var span = $li.find('.jqtree-title');
                        span.text(node.name + " ("
                                + me.elements2String(currentElements) + ")");
                        span.css("color", me.getColor(
                                me.totalNumberOfVariables - 1, node.id));
                        // mark the elements with an outline
                        // and add small labels
                        me.setHighliteLabels(node.variableName,
                                currentElements, node);
                    }
                }
            });

    // get a reference to this for
    // a closure
    var me = this;

    jQuery(treeView)
            .bind(
                    'tree.select',
                    function(event) {
                        var node = event.node;
                        me.selectedNode = node;
                        var nodeId = node.id;
                        var path = me.getPathNamesToNode(node);
                        me.currentSelectedVariable = path.join(".");
                        me.arraySelectionMode = me.pathContainsArray(path);
                        // if this is running in wizard mode
                        if (me.wizardBox) {
                            // select the step with the node.id
                            me.selectWizardStep(node.id, false);
                        }

                        // if this variable has a special value type
                        // special value type
                        if (nodeId in me.selectNodeId2ValueType) {
                            var valueType = me.selectNodeId2ValueType[nodeId];
                            me.currentValueType = valueType;

                            if ("valueTypeBeforeSelect" + valueType in me) {
                                me["valueTypeBeforeSelect" + valueType](node);
                            } else {
                                throw valueType + " not supported";
                            }
                        } else {
                            me.currentValueType = undefined;
                        }

                        if (me.currentSelectedVariable in me.selectedElementsMap) {
                            var selectedElements = me.selectedElementsMap[me.currentSelectedVariable];
                            // disappear and appear again just to show where the
                            // elements are
                            selectedElements.each(function(i, value) {
                                jQuery(value).fadeTo('slow', 0).fadeTo('slow',
                                        1.0);
                            });
                        }
                    });

    this.treeView = treeView;

    if ("__dom2jsonstruct" in template
            && "useWizard" in template["__dom2jsonstruct"]
            && template["__dom2jsonstruct"]["useWizard"]) {
        this.initWizard();
        this.askFortriggerCollecting();
    }
};
/**
 * This function asks for a collecting trigger.
 */
DOM2JsonStructGUI.prototype.askFortriggerCollecting = function() {
    // This would be the trigger for magento
    // Review.prototype.initialize = function (saveUrl, successUrl,
    // agreementsForm) { console.log("do something before");
    // superInitialize.call(this, saveUrl, successUrl, agreementsForm); }

    jQuery(this.wizardBox)
            .html(
                    this.dom2jsonstructTemplate["__dom2jsonstruct"].triggerCollectingWizardText);

    this.showTextInPreview(this.exampleTriggerCollecting);

    var form = document.createElement('form');
    form.style.textAlign = "right";

    var me = this;

    var input = document.createElement('input');

    var validateCodeFunction = function() {
        try {
            var codeToValidate = "(\n"
                    + me.gettriggerCollectingFunctionAsString(me
                            .getTextFromPreview()) + "\n)";
            // console.log(codeToValidate);
            eval(codeToValidate);
            me.previewDiv.style.backgroundColor = "#9f9";
            input.disabled = false;
        } catch (e) {
            alert(e);
            input.disabled = true;
            me.previewDiv.style.backgroundColor = "#f99";
        }
    };

    var validateCodeButton = document.createElement('input');
    // make huge fonts
    validateCodeButton.style.fontSize = "24px";
    validateCodeButton.style.marginLeft = "10px";
    validateCodeButton.type = 'button';
    validateCodeButton.value = 'Validate Code';
    form.appendChild(validateCodeButton);
    jQuery(validateCodeButton).click(function() {
        validateCodeFunction();
    });

    // make huge fonts
    input.style.fontSize = "24px";
    input.style.marginLeft = "10px";
    input.disabled = true;
    input.type = 'button';
    input.value = 'Use as collecting trigger';
    form.appendChild(input);

    this.attachOnBlurToPreview(validateCodeFunction);

    jQuery(input)
            .click(
                    function() {
                        me.dom2jsonstructTemplate["__dom2jsonstruct"].triggerCollecting = me
                                .gettriggerCollectingFunctionAsString(me
                                        .getTextFromPreview());
                        me.clearPreviewDiv();
                        me.selectWizardStep(1, true);
                    });

    this.previewDiv.appendChild(form);
    validateCodeFunction();

};
/**
 * This function returns the triggerCollecting function as a string. It wraps
 * the given text in an error catching function.
 * 
 * @param text
 *                {string} function body
 */
DOM2JsonStructGUI.prototype.gettriggerCollectingFunctionAsString = function(
        text) {
    return "function () { try {\n" + text + "\n} catch(e) {console.log(e)}}";
};
/**
 * This function returns the text from the editor that is currently shown in the
 * preview window.
 * 
 * @returns {string} the text currently shown in the preview
 */
DOM2JsonStructGUI.prototype.getTextFromPreview = function() {
    if (this.previewCodeMirror) {
        return this.previewCodeMirror.getValue();
    } else {
        return this.previewTextArea.value;
    }
};
/**
 * This function attaches an on blur (widget looses focus) handler to the
 * currently used preview text widget (textarea or CodeMirror)
 * 
 * @param onBlur
 *                the function to execute on blur
 */
DOM2JsonStructGUI.prototype.attachOnBlurToPreview = function(onBlur) {
    if (this.previewCodeMirror) {
        return this.previewCodeMirror.on("blur", onBlur);
    } else {
        jQuery(this.previewTextArea).blur(onBlur);
    }
};
/**
 * Init the wizard box.
 */
DOM2JsonStructGUI.prototype.initWizard = function() {
    var wizardBox = document.createElement("div");
    wizardBox.id = 'dom2jsonstructgui-wizard-box';
    wizardBox.style.width = "350px";
    wizardBox.style.textAlign = "left";
    wizardBox.style.fontFamily = "sans-serif";
    wizardBox.style.height = "300px";
    wizardBox.style.overflow = "auto";
    wizardBox.style.zIndex = 20;
    if ("boxShadow" in wizardBox.style) {
        wizardBox.style.boxShadow = "0 0 10px #9999FF";
    }
    this.displayOn(wizardBox, "right", "top");
    document.body.appendChild(wizardBox);
    this.wizardBox = wizardBox;
};
/**
 * Select the wizard step which should be activated
 * 
 * @param step
 *                {number}
 */
DOM2JsonStructGUI.prototype.selectWizardStep = function(step, selectNode) {
    // if this step should be hidden
    // skip to next step
    if (step in this.wizardHideMap) {
        this.selectWizardStep(step + 1, selectNode);
    }
    // if a node was supplied
    // select this node
    if (selectNode) {
        var $tree = jQuery(this.treeView);
        var wizardNode = $tree.tree('getNodeById', step);
        this.selectedNode = wizardNode;
        $tree.tree('selectNode', wizardNode);
    }
    if (step in this.wizardTexts) {
        var appendWizardText = "<p>If you can not select directly the elements"
                + " which contain the requested data please select the element/s that match best."
                + " afterwards please click on the entry in the tree and edit the CSS selector"
                + " in the input box in the bottom right corner manually.</p>";
        jQuery(this.wizardBox).html(this.wizardTexts[step] + appendWizardText);
        // blink so the user knows what to do next
        jQuery(this.wizardBox).fadeTo('slow', 0.8).fadeTo('slow', 1.0);
    }
};
/**
 * This function makes a box availabe to load other templates
 */
DOM2JsonStructGUI.prototype.enableOtherTemplate = function() {
    this.allowsOtherTemplates = true;
    if (this.allowsOtherTemplates) {
        var me = this;
        var templateChanger = jQuery("<a id='dom2jsonstructgui-allow-other-templates' href='#'>Choose other template</a>");
        jQuery(this.treeView).append(templateChanger);
        templateChanger
                .click(function() {
                    var otherTemplate = prompt("Please paste the template as JSON string.");
                    if (otherTemplate) {
                        try {
                            var parsedTemplate = jQuery
                                    .parseJSON(otherTemplate);
                            me.populateTreeFromTemplate(parsedTemplate);
                            me.enableOtherTemplate();
                        } catch (e) {
                            alert(e);
                        }
                    }
                });
    }
};
/**
 * Function which says if the current template contains an array until the
 * leave.
 */
DOM2JsonStructGUI.prototype.pathContainsArray = function(path) {
    var pointer = this.dom2jsonstructTemplate;
    // go throug the template and find the property
    // we want to bind
    for ( var i = 0; i < path.length; i++) {
        if (jQuery.isArray(pointer)) {
            return true;
        }
        pointer = pointer[path[i]];
    }
    return false;
};

/**
 * This function converts a DOM2JsonStruct template to the necessary structure
 * needed for the jqTree.
 * {@link http://mbraak.github.com/jqTree/#tree-options-data}
 * 
 * @param template
 *                {object} JSON Template of DOM2JsonStruct
 * @param pathNames
 *                {Array} an array of the parent names to this node. This is
 *                needed to generate the variable name
 */
DOM2JsonStructGUI.prototype.convertTemplateToJQFormat = function(template,
        pathNames) {
    var nodes = [];
    for ( var property in template) {
        if (property != "__dom2jsonstruct"
                && typeof template[property] === "object") {
            var node = {
                label : property
            };
            pathNames.push(property);
            var children = this.convertTemplateToJQFormat(template[property],
                    pathNames);
            pathNames.pop();
            if (children.length > 0) {
                node.children = children;
            } else {
                node.id = this.totalNumberOfVariables;
                node.variableName = pathNames.join(".")
                        + (pathNames.length > 0 ? "." : "") + property;
                if ("__dom2jsonstruct" in template[property]
                        && "wizardText" in template[property]["__dom2jsonstruct"]) {
                    this.wizardTexts[node.id] = template[property]["__dom2jsonstruct"]["wizardText"];
                }
                if ("__dom2jsonstruct" in template[property]
                        && "valueType" in template[property]["__dom2jsonstruct"]) {
                    this.selectNodeId2ValueType[node.id] = template[property]["__dom2jsonstruct"]["valueType"];
                }
                // if we already have a selector
                if ("__dom2jsonstruct" in template[property]
                        && "selector" in template[property]["__dom2jsonstruct"]) {
                    // save it for the current node
                    // an event handler will care for the style
                    node.selector = template[property]["__dom2jsonstruct"]["selector"];
                }
                // we found a leave
                this.totalNumberOfVariables++;
            }
            // check if we should hide this
            // property in the wizard
            if (!("__dom2jsonstruct" in template[property])
                    || !("hideInTree" in template[property]["__dom2jsonstruct"])
                    || !(template[property]["__dom2jsonstruct"]["hideInTree"])) {
                nodes.push(node);
            } else {
                // save the node in the hide map
                this.wizardHideMap[node.id] = true;
            }
        }
    }
    return nodes;
};
/**
 * Return the Json data of the tree view.
 */
DOM2JsonStructGUI.prototype.getTreeViewData = function() {
    return jQuery(this.treeView).tree('getTree').getData();
};
/**
 * Function that returns the current template as JSON.
 */
DOM2JsonStructGUI.prototype.getJSONTemplate = function() {
    // make a copy of this template
    var myTemplate = this.clone(this.dom2jsonstructTemplate);

    // take all calculateValue function and replace
    // them with a text version
    var replaceFunctionWithFunctionString = function(key, value, parent) {
        if ((key == "calculateValue" || key == "preSetProcessing"
                || key == "preValidate" || key == "triggerCollecting"
                || key == "postValidate" || key == "arraySizeHint")
                && typeof parent[key] == "function") {
            parent[key] = parent[key].toString();
        }
    };
    this.traverse(myTemplate, replaceFunctionWithFunctionString);

    var jsonTemplateString = JSON.stringify(myTemplate);

    var replaceFunctionStringWithFunction = function(key, value) {
        if (key == "calculateValue" || key == "preSetProcessing"
                || key == "preValidate" || key == "triggerCollecting"
                || key == "postValidate" || key == "arraySizeHint") {
            jsonTemplateString = jsonTemplateString.replace(JSON
                    .stringify(value), value);
        }
    };
    this.traverse(myTemplate, replaceFunctionStringWithFunction);
    return jsonTemplateString;
};
/**
 * Clones recursively an object. http://jsperf.com/cloning-an-object/2
 * http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-a-javascript-object
 * 
 * @param obj
 *                {object} the object to clone
 * @returns {object} a complete copy of the object.
 */
DOM2JsonStructGUI.prototype.clone = function(obj) {

    if ("clone" in obj) {
        // use ES5 clone function (very fast)
        return obj.clone();
    }

    return jQuery.extend(true, {}, obj);
};
/**
 * Traverse the object with the given function.
 * 
 * @param o
 * @param func
 */
DOM2JsonStructGUI.prototype.traverse = function(o, func) {
    for ( var i in o) {
        func.apply(this, [ i, o[i], o ]);
        if (typeof (o[i]) == "object") {
            // going on step down in the object tree!!
            DOM2JsonStructGUI.prototype.traverse(o[i], func);
        }
    }
};
/**
 * This function is called when a node with the value type constant is selected.
 * 
 * @param node
 *                {object} the node from the treeView which was clicked
 */
DOM2JsonStructGUI.prototype.valueTypeBeforeSelectconstant = function(node) {
    var constantValue = prompt("Insert your constant value for this property");
    if (constantValue) {
        this.setPropertyInTemplate("constantValue", constantValue);

        var nodeLabel = jQuery(node.element).find("span");
        nodeLabel.text(node.name + " (" + constantValue + ")");
        nodeLabel.css("color", this.getColor(this.totalNumberOfVariables - 1,
                node.id));

    }
    if (this.wizardBox) {
        this.selectWizardStep(node.id + 1, true);
    }
};
/**
 * This function is called after a selection for a certain variable was made.
 * 
 * @param node
 *                {object} node which was selected
 * @param currentElements
 *                {Array} selected elements
 */
DOM2JsonStructGUI.prototype.valueTypeAfterSelectconstant = function(node,
        currentElements) {

};
/**
 * This function is called when a node with the value type mapping is selected.
 * 
 * @param node
 *                {object} the node from the treeView which was clicked
 */
DOM2JsonStructGUI.prototype.valueTypeBeforeSelectmapping = function(node) {
};
/**
 * This function is called after a selection for a certain variable was made.
 * 
 * @param node
 *                {object} node which was selected
 * @param currentElements
 *                {Array} selected elements
 */
DOM2JsonStructGUI.prototype.valueTypeAfterSelectmapping = function(node,
        currentElements) {

};
/**
 * This function is called when a node with the value type singleString is
 * selected.
 * 
 * @param node
 *                {object} the node from the treeView which was clicked
 */
DOM2JsonStructGUI.prototype.valueTypeBeforeSelectsingleString = function(node) {

};
/**
 * This function is called after a selection for a certain variable was made.
 * 
 * @param node
 *                {object} node which was selected
 * @param currentElements
 *                {Array} selected elements
 */
DOM2JsonStructGUI.prototype.valueTypeAfterSelectsingleString = function(node,
        currentElements) {
    var me = this;
    if (currentElements == undefined || currentElements.length < 1) {
        throw "There must be at least one element selected.";
    }
    this.generateAndCleanPreviewDiv();
    var singleStringDiv = document.createElement('div');
    singleStringDiv.textContent = "Select the string you want to use.";

    this.makeSexyElement(singleStringDiv);
    singleStringDiv.style.padding = "4em";

    var ul = document.createElement('ul');
    // make huge fonts
    ul.style.fontSize = "24px";
    singleStringDiv.appendChild(ul);

    var firstElement = currentElements[0];

    var elementString = jQuery(firstElement).html();

    if (!elementString) {
        me.clearPreviewDiv();
        throw "There is no string in the selected elements.";
    }

    var splitString = "( )|(<br />)";
    var splitPattern = new RegExp(splitString);
    var stringElements = elementString.split(splitPattern);

    for ( var i in stringElements) {
        var stringElement = stringElements[i];
        if (typeof stringElement == "string") {
            var el = document.createElement("li");
            el.textContent = stringElement;
            el.value = i;
            ul.appendChild(el);
            jQuery(el)
                    .click(
                            function() {
                                var indexName = this.value;
                                // if the last string is selected
                                // use always the last element
                                if (this.value == (stringElements.length - 1)) {
                                    indexName = "stringList.length-1";
                                }

                                me
                                        .setPropertyInTemplate(
                                                "preSetProcessing",
                                                "function (domNode) { var regex = new RegExp(\""
                                                        + splitString
                                                        + "\"); if(domNode == undefined || !(\"innerHTML\" in domNode)) { return undefined; } var stringList = domNode.innerHTML.split(regex); var myPartString = stringList["
                                                        + indexName
                                                        + "]; return myPartString;}",
                                                node);

                                var nodeLabel = jQuery(node.element).find(
                                        "span");
                                nodeLabel.text(node.name + " ("
                                        + this.textContent + ")");
                                nodeLabel
                                        .css("color", me.getColor(
                                                me.totalNumberOfVariables - 1,
                                                node.id));

                                me.clearPreviewDiv();
                                // continue with next step if running in wizard
                                // mode
                                if (me.wizardBox) {
                                    me.selectWizardStep(node.id + 1, true);
                                }
                            });

        }
    }
    singleStringDiv.appendChild(ul);

    this.previewDiv.appendChild(singleStringDiv);
};
/**
 * This function is called when a node with the value type regexFloat is
 * selected.
 */
DOM2JsonStructGUI.prototype.valueTypeBeforeSelectregexFloat = function(node) {

};
/**
 * This function is called after a selection for a certain variable was made.
 * 
 * @param node
 *                {object} node which was selected
 * @param currentElements
 *                {Array} selected elements
 */
DOM2JsonStructGUI.prototype.valueTypeAfterSelectregexFloat = function(node,
        currentElements) {
    var me = this;
    if (currentElements == undefined || currentElements.length < 1) {
        throw "There must be at least one element selected.";
    }
    this.generateAndCleanPreviewDiv();
    var regexpFloatForm = document.createElement('form');
    regexpFloatForm.textContent = "Enter the regular expression which should be used to extract the float from the given string. First group is pre-decimal places and second group is position after decimal point:";

    this.makeSexyElement(regexpFloatForm);
    regexpFloatForm.style.padding = "4em";

    var firstElement = currentElements[0];

    var elementString = jQuery(firstElement).html();

    if (!elementString) {
        me.clearPreviewDiv();
        throw "There is no string in the selected elements.";
    }

    var regexpBase = document.createElement('div');
    regexpBase.textContent = elementString;
    regexpBase.style.backgroundColor = "#99f";
    regexpBase.style.padding = "1em";
    regexpBase.style.marginTop = "1em";
    regexpFloatForm.appendChild(regexpBase);

    var regexpInput = document.createElement('input');
    // make huge fonts
    regexpInput.style.fontSize = "24px";
    regexpInput.style.width = "100%";
    regexpInput.style.marginTop = "1em";
    regexpInput.type = 'text';
    regexpInput.value = '.*?(\\d*,?\\d*,?\\d+)\\.?(\\d*)?.*';
    regexpFloatForm.appendChild(regexpInput);

    var regexpOutput = document.createElement('div');
    var regexpError = document.createElement('div');
    var input = document.createElement('input');
    input.disabled = true;
    var functionUpdateRegexp = function() {

        var htmlString = jQuery(firstElement).html();
        var regex = undefined;
        try {
            regex = new RegExp(regexpInput.value);
            regexpError.textContent = "";
        } catch (e) {
            regexpError.textContent = e;
            regexpOutput.style.backgroundColor = "#f99";
            input.disabled = true;
        }
        if (htmlString != undefined && regex != undefined) {
            htmlString.match(regex);
            var beforePoint = RegExp.$1;
            var afterPoint = RegExp.$2;
            var potentialFloat = undefined;
            if (beforePoint) {
                beforePoint = beforePoint.replace(/[^0-9]/g, "");
                potentialFloat = parseFloat(beforePoint + "." + afterPoint);
            }
            regexpOutput.textContent = potentialFloat;
            if (typeof potentialFloat == "number" && !isNaN(potentialFloat)) {
                // green
                regexpOutput.style.backgroundColor = "#9f9";
                input.disabled = false;
            } else {
                // red
                regexpOutput.style.backgroundColor = "#f99";
            }
        } else if (htmlString == undefined) {
            throw "Element does not containg valid html code";
        }
    };

    jQuery(regexpInput).keyup(functionUpdateRegexp);

    // make huge fonts
    regexpOutput.style.fontSize = "24px";
    regexpOutput.style.padding = "1em";
    regexpOutput.style.marginTop = "1em";
    regexpFloatForm.appendChild(regexpOutput);

    regexpOutput.style.fontSize = "24px";
    regexpFloatForm.appendChild(regexpError);
    functionUpdateRegexp();

    // make huge fonts
    input.style.fontSize = "24px";
    input.style.marginTop = "1em";
    input.style.float = "right";
    input.type = 'button';
    input.value = 'Use';
    regexpFloatForm.appendChild(input);

    var me = this;

    jQuery(input)
            .click(
                    function() {
                        me
                                .setPropertyInTemplate(
                                        "preSetProcessing",
                                        "function (domNode) { var regex = new RegExp(\""
                                                + regexpInput.value.replace(
                                                        /\\/g, "\\\\")
                                                + "\"); if(domNode == undefined || !(\"innerHTML\" in domNode)) {\n return undefined; }\n domNode.innerHTML.match(regex);\n var beforePoint = RegExp.$1;\n var afterPoint = RegExp.$2;\nvar potentialFloat = undefined;\n if(beforePoint) {\n beforePoint = beforePoint.replace(/[^0-9]/g, \"\");\n return parseFloat(beforePoint+\".\"+afterPoint); } else { return undefined; }}",
                                        node);

                        var nodeLabel = jQuery(node.element).find("span");
                        nodeLabel.text(node.name + " ("
                                + regexpOutput.textContent + ")");
                        nodeLabel.css("color", me.getColor(
                                me.totalNumberOfVariables - 1, node.id));

                        me.clearPreviewDiv();
                        // continue with next step if running in wizard
                        // mode
                        if (me.wizardBox) {
                            me.selectWizardStep(node.id + 1, true);
                        }
                    });

    this.previewDiv.appendChild(regexpFloatForm);
};
/**
 * This function is called when a node with the value type fromCookie is
 * selected.
 */
DOM2JsonStructGUI.prototype.valueTypeBeforeSelectfromCookie = function(node) {
    this.generateAndCleanPreviewDiv();

    var form = document.createElement('form');

    this.makeSexyElement(form);
    form.style.padding = "4em";

    var select = document.createElement('select');
    // make huge fonts
    select.style.fontSize = "24px";
    form.appendChild(select);

    var input = document.createElement('input');
    // make huge fonts
    input.style.fontSize = "24px";
    input.style.marginLeft = "10px";
    input.type = 'button';
    input.value = 'Use';
    form.appendChild(input);

    var me = this;

    jQuery(input).click(
            function() {

                var optionValue = select.options[select.selectedIndex].value;

                me.setPropertyInTemplate("calculateValue",
                        "function () { return document.cookie.match(/"
                                + optionValue
                                + "=([^;]*)/) ? RegExp.$1 : undefined; }");

                var nodeLabel = jQuery(node.element).find("span");
                var pattern = new RegExp(optionValue + "=([^;]*)");
                nodeLabel.text(node.name
                        + " ("
                        + (document.cookie.match(pattern) ? RegExp.$1
                                : undefined) + ")");
                nodeLabel.css("color", me.getColor(
                        me.totalNumberOfVariables - 1, node.id));

                me.clearPreviewDiv();
                // continue with next step if running in wizard mode
                if (me.wizardBox) {
                    me.selectWizardStep(node.id + 1, true);
                }
            });

    this.previewDiv.appendChild(form);

    this.previewDiv.style.position = "fixed";

    var cookieKeys = this.docCookies.keys();
    // no cookies found skip to next
    if (cookieKeys.length == 0) {
        if (this.wizardBox) {
            this.selectWizardStep(step + 1, true);
        }
        return;
    }

    for ( var i in cookieKeys) {
        var cookieKey = cookieKeys[i];
        if (typeof cookieKey == "string") {
            var el = document.createElement("option");
            el.textContent = cookieKey;
            el.value = cookieKey;
            select.appendChild(el);
        }
    }
};
/**
 * This function is called after a selection for a certain variable was made.
 * 
 * @param node
 *                {object} node which was selected
 * @param currentElements
 *                {Array} selected elements
 */
DOM2JsonStructGUI.prototype.valueTypeAfterSelectfromCookie = function(node,
        currentElements) {

};
/**
 * This function is called when a node with the value type constant is selected.
 * 
 * @param node
 *                {object} the node from the treeView which was clicked
 */
DOM2JsonStructGUI.prototype.valueTypeBeforeSelectimage = function(node) {
};
/**
 * This function is called after a selection for a certain variable was made.
 * 
 * @param node
 *                {object} node which was selected
 * @param currentElements
 *                {Array} selected elements
 */
DOM2JsonStructGUI.prototype.valueTypeAfterSelectimage = function(node,
        currentElements) {
    this
            .setPropertyInTemplate(
                    "preSetProcessing",
                    "function (domNode) { return ((domNode != undefined && 'src' in domNode) ? domNode.src : '' ) }",
                    node);
};
/**
 * Checks if the given object is an array.
 * {@link http://stackoverflow.com/questions/4775722/javascript-check-if-object-is-array}
 */
DOM2JsonStructGUI.prototype.isArray = function(obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]');
};

/**
 * contentloaded.js
 * 
 * Author: Diego Perini (diego.perini at gmail.com) Summary: cross-browser
 * wrapper for DOMContentLoaded Updated: 20101020 License: MIT Version: 1.2
 * 
 * URL: {@link http://javascript.nwbox.com/ContentLoaded/}
 * {@link http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE}
 * {@link http://molily.de/js/event-handling-onload.html}
 * 
 * @param {win}
 *                window reference
 * @param {fn}
 *                function reference
 */
DOM2JsonStructGUI.contentLoaded = function(win, fn) {

    var done = false, top = true,

    doc = win.document, root = doc.documentElement,

    add = doc.addEventListener ? 'addEventListener' : 'attachEvent', rem = doc.addEventListener ? 'removeEventListener'
            : 'detachEvent', pre = doc.addEventListener ? '' : 'on';

    var init = undefined;
    init = function(e) {
        if (e.type == 'readystatechange' && doc.readyState != 'complete')
            return;
        (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
        if (!done && (done = true))
            fn.call(win, e.type || e);
    };

    var poll = undefined;
    poll = function() {
        try {
            root.doScroll('left');
        } catch (e) {
            setTimeout(poll, 50);
            return;
        }
        init('poll');
    };

    if (doc.readyState == 'complete')
        fn.call(win, 'lazy');
    else {
        if (doc.createEventObject && root.doScroll) {
            try {
                top = !win.frameElement;
            } catch (e) {
            }
            if (top)
                poll();
        }
        doc[add](pre + 'DOMContentLoaded', init, false);
        doc[add](pre + 'readystatechange', init, false);
        win[add](pre + 'load', init, false);
    }

};
/**
 * Init DOM2JsonStructGUI
 */
DOM2JsonStructGUI.init = function() {
    // only initialize if we are not running in testing framework
    // and we do not have an init function
    if (!document.getElementById("qunit")
            && typeof window.__incentergyInitGUI != "function") {
        var dom2structGUI = new DOM2JsonStructGUI(document.body);

        /*
         * dom2structGUI.populateTreeFromTemplate({ __dom2jsonstruct : {
         * useWizard : true }, billingAddress : { givenName : { __dom2jsonstruct : {
         * wizardText : "Please select the given name." } }, familyName : {
         * __dom2jsonstruct : { wizardText : "Please select the family name." } } },
         * lineItems : [ { name : { __dom2jsonstruct : { wizardText : "Please
         * select the name of the lineItems." } }, price : { __dom2jsonstruct : {
         * wizardText : "Please select the price of the lineItems." } } } ],
         * total : { } }); dom2structGUI.enableOtherTemplate();
         */

        dom2structGUI
                .populateTreeFromTemplate({
		"__dom2jsonstruct" : {
			"useWizard" : true,
			"triggerCollectingWizardText" : "Here you have to define a javascript expression that will determine if collecting and sendin data for an order should be started.",
			"saveSelfURL" : "http://localhost:8080/semRecSys-rest/JsonStructService/jobOffer"
		},
		"id" : {
			"__dom2jsonstruct" : {
				"hideInTree" : true,
				"calculateValue" : function(alreadyCollected) {
					// generate a rfc4122 compatible uuid
					// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
					return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
					.replace(
						/[xy]/g,
						function(c) {
							var r = Math.random() * 16 | 0, v = c == 'x' ? r
							: (r & 0x3 | 0x8);
							return v.toString(16);
						});
				}
			}
		},
		"creationDate" : {
			"__dom2jsonstruct" : {
				"hideInTree" : true,
				"calculateValue" : function(alreadyCollected) {
					// see Date.prototype.toISOString in
					// DOM2JsonStruct
					// or ECMAScript 5
					return new Date().toISOString();
				}
			}
		},
		"url" : {
			"__dom2jsonstruct" : {
				"hideInTree" : true,
				"calculateValue" : function(alreadyCollected) {
					return window.location.href;
				}
			}
		},
		"title" : {
			"__dom2jsonstruct" : {
				"wizardText" : "Please select the title of the job offer"
			}
		},
		"body" : {
			"__dom2jsonstruct" : {
				"wizardText" : "Please select the main text of the job offer"
			}
		},
		"publisher" : {
			"__dom2jsonstruct" : {
				"wizardText" : "Please select the publisher of the job offer"
			}
		},
		"location" : {
			"__dom2jsonstruct" : {
				"wizardText" : "Please select the location of this job offer."
			}
		}
	});
        dom2structGUI.enableOtherTemplate();
    } else if (typeof window.__incentergyInitGUI == "function"
            && !document.getElementById("dom2jsonstructgui-tree-view")) {
        window.__incentergyInitGUI();
    }
};
// Intialize the DOM2JsonStructGUI if the content is completly loaded
DOM2JsonStructGUI
        .contentLoaded(
                window,
                function() {
                    if (!window.jQuery) {
                        // load jQuery in case it is not their.
                        var s = document.createElement("script");
                        s
                                .setAttribute("src",
                                        "https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.js");
                        s.setAttribute("type", "text/javascript");
                        document.getElementsByTagName("head")[0].appendChild(s);
                    }
                    DOM2JsonStructGUI.init();
                });
