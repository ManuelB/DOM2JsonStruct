// check to see if console exists. If not, create an empty object for it,
// then create and empty logging function which does nothing.
//
// REMEMBER: put this before any other console.log calls
if (typeof window !== "undefined" && !window.console) {
    window.console = {};
    window.console.log = function() {
    };
}
/**
 * This function create a DOM2JsonStruct parser.
 * 
 * The documentation can be found here:
 * {@link https://source.incentergy.de/maven-site/semRecSys-rest/DOM2JsonStructGUI.html}
 * Further the test cases for this class containing a lot of examples can be run
 * here:
 * {@link https://source.incentergy.de/svn/semrecsys/trunk/semRecSys/rest/src/test/javascript/dom2jsonstruct_tests.html}
 * The API Documentation is hosted here:
 * {@link https://source.incentergy.de/svn/semrecsys/trunk/doc/SEMRECSYS-612/jsdoc/DOM2JsonStruct.html}
 * 
 * @example var listTemplateBinding = [{ __dom2jsonstruct : { selector : "li", }
 *          }];
 * 
 * var dom2json = new DOM2JsonStruct(htmlDoc); var outputList =
 * dom2json.collectDataForTemplate(listTemplateBinding);
 * 
 * 
 * @class
 * @classdesc DOM2JsonStruct parser class
 * @author Manuel Blechschmidt <blechschmidt@incentergy.de>
 * @constructor
 * @this {DOM2JsonStruct}
 * @param {Document}
 *                dom The document which should be used if empty window.document
 *                will be used
 */
var DOM2JsonStruct = function(dom) {

    if (typeof window !== "undefined" && !window.__IncentergySizzle
            && !window.jQuery) {
        // load jQuery in case it is not their. We only need Sizzle
        var s = this.dom.createElement("script");
        s.setAttribute("src",
                "https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.js");
        s.setAttribute("type", "text/javascript");
        this.dom.getElementsByTagName("head")[0].appendChild(s);
    }

    // if we have IncentergySizzle let's take it
    // otherwise use the find function from jQuery
    // http://sizzlejs.com/
    this.selectorEngine = typeof window !== "undefined" && window.__IncentergySizzle ? window.__IncentergySizzle
            : (typeof jQuery !== "undefined" ? jQuery.find : undefined);
    // map which maps outputObjects to
    // errors which were raised during parsing
    this.errors2outputObjects = {};
    this.parsedObjectCount = 0;
    this.setDOM(dom);
    // enabled debugging
    this.debug = false;
    // save the current template for this instance
    this.currentTemplate = undefined;
};
/**
 * Sets the selector engine. The selector engine must be a function that takes
 * two arguments. - cssSelector - DOM the implementation
 * 
 * @param {function}
 *                selectorEngine The selector engine to use
 */
DOM2JsonStruct.prototype.setSelectorEngine = function(selectorEngine) {
    this.selectorEngine = selectorEngine;
};
/**
 * Toggle debugging output.
 */
DOM2JsonStruct.prototype.toggleDebug = function() {
    this.debug = !this.debug;
};
/**
 * This function takes a template string and executes it against the current
 * DOM.
 * 
 * @param {string}
 *                templateString the template as a jsonString including
 *                functions
 * @param ignoreTriggerCollecting
 *                {boolean} just start collecting and ignore triggerCollecting
 */
DOM2JsonStruct.prototype.collectDataForTemplateFromString = function(
        templateString, ignoreTriggerCollecting) {
    return this.collectDataForTemplate(eval('(' + templateString + ')'),
            ignoreTriggerCollecting);
};
/**
 * Collects all the data based on the binding given in the template. During
 * doing this validations and processing steps are executed. This function is
 * expensive because it calls recursive structures and makes multiple css
 * selector calls. It might throw an error if the template uses the rethrow
 * property otherwise it will collect the errors found during collecting data
 * for the template from the dom.
 * 
 * @param template
 *                {object} The template containing __dom2jsonstruct bindings
 * @param ignoreTriggerCollecting
 *                {boolean} just start collecting and ignore triggerCollecting
 * @this {DOM2JsonStruct}
 * @throws Error
 *                 An error from the validate functions in the template if
 *                 rethrow is used
 * @return {object} The object which was collected with the template.
 */
DOM2JsonStruct.prototype.collectDataForTemplate = function(template,
        ignoreTriggerCollecting) {
    if (!this.isArray(template) && typeof template != "object") {
        throw new Error("template must be an array or an object but is: "
                + typeof template);
    }
    var outputObject = this.isArray(template) ? [] : {};
    var parsedObjectCount = this.parsedObjectCount;
    // this function is for generating array keys
    // for the error hashmap
    outputObject.toString = function() {
        return "Object_Number" + parsedObjectCount;
    };
    this.parsedObjectCount++;
    this.currentTemplate = template;
    var rootDom2jsonstructInfo = undefined;
    if (this.isArray(template) && template.length > 0
            && "__dom2jsonstruct" in template[0]) {
        rootDom2jsonstructInfo = template[0]["__dom2jsonstruct"];
    } else if ("__dom2jsonstruct" in template) {
        rootDom2jsonstructInfo = template["__dom2jsonstruct"];
    }

    if (!ignoreTriggerCollecting) {
        if (rootDom2jsonstructInfo != undefined
                && "triggerCollecting" in rootDom2jsonstructInfo
                && typeof rootDom2jsonstructInfo["triggerCollecting"] == "function") {
            if (!rootDom2jsonstructInfo["triggerCollecting"]()) {
                // do not collect data when triggerCollecting return false
                return;
            }
        } else if (rootDom2jsonstructInfo != undefined
                && "triggerCollecting" in rootDom2jsonstructInfo) {
            console.log("triggerCollecting in object is not a function");
        }
    }

    this.errors2outputObjects[outputObject] = [];
    this.__traverseObject(template, outputObject, [], [], this
            .isArray(template) ? 0 : undefined);

    try {

        if (rootDom2jsonstructInfo !== undefined
                && "postValidate" in rootDom2jsonstructInfo
                && typeof rootDom2jsonstructInfo.postValidate == "function") {
            rootDom2jsonstructInfo.postValidate(outputObject);
        }
    } catch (err) {
        if ("rethrow" in err && err.rethrow) {
            throw err;
        } else {
            this.errors2outputObjects[outputObject].push(err);
        }
    }

    return outputObject;
};

/**
 * Function which traveses the template object recursively and executed the
 * given actions.
 * 
 * @private
 * @param inputElement
 *                {object} The current element to process
 * @param outputObject
 *                {object} The object that was generated till now
 * @param path
 *                {object} The path in the template
 * @param pathNames
 *                {object} The keys of the objects in path
 * @param pathIsArrayNum
 *                {object} was an array in the path
 */
DOM2JsonStruct.prototype.__traverseObject = function(inputElement,
        outputObject, path, pathNames, pathIsArrayNum) {

    if (this.debug) {
        console.log("Processing " + pathNames.join(" > "));
    }

    // this function will check for cycles in the object structure
    // if one is found an error is thrown
    this.__detectCycle(inputElement, path);

    var dom2jstonstructInfo = undefined;

    var moreProperties = [ inputElement ];
    var isArray = false;

    if (this.isArray(inputElement)) {
        isArray = true;
        pathIsArrayNum = path.length;
    }

    if (isArray && inputElement.length > 0
            && "__dom2jsonstruct" in inputElement[0]) {
        dom2jstonstructInfo = inputElement[0]["__dom2jsonstruct"];
        moreProperties = inputElement;
    } else if ("__dom2jsonstruct" in inputElement) {
        dom2jstonstructInfo = inputElement["__dom2jsonstruct"];
        if ("calculateValue" in dom2jstonstructInfo
                && typeof dom2jstonstructInfo.calculateValue == "function") {
            this.__setOutputObjectValue(outputObject, dom2jstonstructInfo
                    .calculateValue(outputObject), pathNames, pathIsArrayNum,
                    dom2jstonstructInfo.preSetProcessing,
                    dom2jstonstructInfo.preValidate,
                    dom2jstonstructInfo.arraySizeHint, path);
        } else if ("constantValue" in dom2jstonstructInfo) {
            this.__setOutputObjectValue(outputObject,
                    dom2jstonstructInfo.constantValue, pathNames,
                    pathIsArrayNum, dom2jstonstructInfo.preSetProcessing,
                    dom2jstonstructInfo.preValidate,
                    dom2jstonstructInfo.arraySizeHint, path);
        }
    }
    if (dom2jstonstructInfo !== undefined && "selector" in dom2jstonstructInfo
            && pathIsArrayNum != path) {
        var cssSelector = dom2jstonstructInfo["selector"];
        var foundObjects = this.selectorEngine(cssSelector, this.dom);
        if (this.debug) {
            console.log("CSS Selector: " + cssSelector);
            console.log(foundObjects);
        }
        this.__setOutputObjectValue(outputObject,
                foundObjects.length == 1 ? foundObjects[0] : foundObjects,
                pathNames, pathIsArrayNum,
                dom2jstonstructInfo.preSetProcessing,
                dom2jstonstructInfo.preValidate);
    }

    // only take the first entry of the array for further processing
    for ( var i = 0; i < moreProperties.length && i < 1; i++) {
        for ( var prop in inputElement) {
            if (prop != "__dom2jsonstruct"
                    && typeof inputElement[prop] === "object") {
                path.push(inputElement);
                pathNames.push(prop);
                this.__traverseObject(inputElement[prop], outputObject, path,
                        pathNames, pathIsArrayNum);
                pathNames.pop();
                path.pop();
            }
        }
    }
};

/**
 * Checks for cycles in template code
 * 
 * @param object
 *                {object} the element to search
 * @param path
 *                {Array} the array to search
 * @throws Error
 *                 if the object is already in the path
 */
DOM2JsonStruct.prototype.__detectCycle = function(object, path) {
    if (this.inArray(object, path) != -1) {
        throw new Error("Found cycle in template. Please review template.");
    }
};
/**
 * Sets a value in the output object based on the current path.
 * 
 * @private
 */
DOM2JsonStruct.prototype.__setOutputObjectValue = function(outputObject, value,
        pathNames, pathIsArrayNum, preSetProcessing, preValidate,
        arraySizeHintFunction, firstArrayElement) {
    var pointer = outputObject;
    var lastRef = undefined;
    var lastName = undefined;

    // if we are directly processing a list
    if (pathIsArrayNum === 0) {
        var i = 0;

        // assign all the values in the value array
        // to the template values
        // if value is not an array only assign the
        // value to the objects which are already there
        for ( var j = i; ((j < value.length) && (this.isArray(value)) || j < outputObject.length); j++) {
            if (outputObject[j] === undefined) {
                outputObject[j] = {};
            }
            var arrayPointer = outputObject[j];
            for ( var p = i; p < pathNames.length - 2; p++) {
                if (arrayPointer[pathNames[p + 2]] === undefined) {
                    arrayPointer[pathNames[p + 2]] = {};
                }
                lastRef = arrayPointer;
                lastName = pathNames[p + 2];
                arrayPointer = arrayPointer[pathNames[p + 1]];
            }
            if (lastRef === undefined && lastName === undefined) {
                var valueToSet = typeof preSetProcessing == "function" ? preSetProcessing(value[j])
                        : (typeof value == "object" && "innerHTML" in value[j] ? value[j].innerHTML
                                : value[j]);
                if (typeof preValidate == "function") {
                    try {
                        preValidate(valueToSet);
                    } catch (err) {
                        if ("rethrow" in err && err.rethrow) {
                            throw err;
                        } else {
                            this.errors2outputObjects[outputObject].push(err);
                        }
                    }
                }
                outputObject[j] = valueToSet;
            } else {
                var valueToSet = typeof preSetProcessing == "function" ? preSetProcessing(this
                        .isArray(value) ? value[j] : value)
                        : (typeof value == "object" && "innerHTML" in value[j] ? value[j].innerHTML
                                : this.isArray(value) ? value[j] : value);
                if (typeof preValidate == "function") {
                    try {
                        preValidate(valueToSet);
                    } catch (err) {
                        if ("rethrow" in err && err.rethrow) {
                            throw err;
                        } else {
                            this.errors2outputObjects[outputObject].push(err);
                        }
                    }
                }
                lastRef[lastName] = valueToSet;
            }
        }
        return;
    }
    // climb down output object
    for ( var i = 0; i < pathNames.length; i++) {
        if (pointer[pathNames[i]] === undefined) {
            if (pathIsArrayNum == i + 1) {
                pointer[pathNames[i]] = [];
            } else {
                pointer[pathNames[i]] = {};
            }
        }
        if (pathIsArrayNum === i + 1) {
            var arraySizeHint = 0;
            if (typeof arraySizeHintFunction == "function") {
                var hint = arraySizeHintFunction(firstArrayElement,
                        this.selectorEngine, this.dom);
                if (typeof hint == "number") {
                    arraySizeHint = hint;
                }
            }

            for ( var j = 0; ((j < value.length) && this.isArray(value))
                    || j < pointer[pathNames[i]].length || j < arraySizeHint
                    || (j == 0 && value != undefined); j++) {
                if (pointer[pathNames[i]][j] === undefined) {
                    pointer[pathNames[i]][j] = {};
                }
                var arrayPointer = pointer[pathNames[i]][j];
                lastRef = arrayPointer;
                lastName = pathNames[i + 2];
                var valueToSet;
                if (typeof preSetProcessing == "function") {
                    valueToSet = preSetProcessing(this.isArray(value) ? value[j]
                            : value);
                } else {
                    if(typeof value == "object"
                        && this.isArray(value) && typeof value[j] == "object"
                            && "innerHTML" in value[j]) {
                        valueToSet = value[j].innerHTML;
                    } else if(this.isArray(value)) {
                        valueToSet = value[j];
                    } else if(typeof value == "object"
                        && "innerHTML" in value) {
                        valueToSet = value.innerHTML;
                    } else {
                        valueToSet = value;
                    }
                }
                if (typeof preValidate == "function") {
                    try {
                        preValidate(valueToSet);
                    } catch (err) {
                        if ("rethrow" in err && err.rethrow) {
                            throw err;
                        } else {
                            this.errors2outputObjects[outputObject].push(err);
                        }
                    }
                }
                
                // find correct element in array
                for ( var p = i + 2; p < pathNames.length - 1; p++) {
                    if (lastRef[pathNames[p]] === undefined) {
                        lastRef[pathNames[p]] = {};
                    }
                    preLastRef = lastRef;
                    lastRef = lastRef[pathNames[p]];
                    lastName = pathNames[p + 1];
                }
                
                if(lastName != undefined) {
                    lastRef[lastName] = valueToSet;
                } else {
                    // this should be set as direct array
                    pointer[pathNames[i]][j] = valueToSet; 
                }
            }
            return;
        }
        lastRef = pointer;
        lastName = pathNames[i];
        pointer = pointer[pathNames[i]];
    }
    if (pathIsArrayNum !== 0) {
        var valueToSet = typeof preSetProcessing == "function" ? preSetProcessing(value)
                : (typeof value == "object" && "innerHTML" in value ? value.innerHTML
                        : value);
        if (typeof preValidate == "function") {
            try {
                preValidate(valueToSet);
            } catch (err) {
                if ("rethrow" in err && err.rethrow) {
                    throw err;
                } else {
                    this.errors2outputObjects[outputObject].push(err);
                }
            }
        }
        lastRef[lastName] = valueToSet;
    }
};
/**
 * This functions collects for the given template the data from the DOM and
 * afterwards sends it to the given url in the template.
 * 
 * @param template
 *                {object} the template to process
 * @param ignoreTriggerCollecting
 *                {boolean} just start collecting and ignore triggerCollecting
 * 
 */
DOM2JsonStruct.prototype.collectAndSend = function(template,
        ignoreTriggerCollecting) {
    // if the template is empty to nothing
    if (!template || typeof template != "object") {
        return;
    }
    var collectedObject = this.collectDataForTemplate(template,
            ignoreTriggerCollecting);
    if (collectedObject) {
        var rootDom2jsonstructInfo = undefined;
        if (this.isArray(template) && template.length > 0
                && "__dom2jsonstruct" in template[0]) {
            rootDom2jsonstructInfo = template[0]["__dom2jsonstruct"];
        } else if ("__dom2jsonstruct" in template) {
            rootDom2jsonstructInfo = template["__dom2jsonstruct"];
        }
        if (rootDom2jsonstructInfo != undefined
                && "saveObjectURL" in rootDom2jsonstructInfo) {
            var saveObjectURL = rootDom2jsonstructInfo["saveObjectURL"];

            // force https if the website was loaded from https
            if (typeof window != "undefined" && "location" in window
                    && window.location && "protocol" in window.location
                    && 'https:' == window.location.protocol) {
                saveObjectURL = saveObjectURL.replace(/http:\/\//, "https://");
            }

            if (rootDom2jsonstructInfo["saveMethod"] == "post") {
                var params = {};
                params["object"] = JSON.stringify(collectedObject);
                // The rest of this code assumes you are not using a library.
                // It can be made less wordy if you use one.
                var form = this.dom.createElement("form");
                form.setAttribute("method", "POST");
                form.setAttribute("action", saveObjectURL);
                form.setAttribute("target", "incentergy-send-object-iframe");

                for ( var key in params) {
                    if (params.hasOwnProperty(key)) {
                        var hiddenField = document.createElement("input");
                        hiddenField.setAttribute("type", "hidden");
                        hiddenField.setAttribute("name", key);
                        hiddenField.setAttribute("value", params[key]);

                        form.appendChild(hiddenField);
                    }
                }

                var iframe = document.createElement('iframe');
                iframe.frameBorder = 0;
                iframe.width = "600px";
                iframe.height = "600px";
                iframe.style.position = "fixed";
                iframe.style.top = "50%";
                iframe.style.left = "50%";
                iframe.style.marginTop = "-300px";
                iframe.style.marginLeft = "-300px";
                iframe.style.backgroundColor = "#fff";
                iframe.style.zIndex = "10";
                iframe.id = "incentergy-send-object-iframe";
                iframe.name = "incentergy-send-object-iframe";
                this.dom.body.appendChild(iframe);

                this.dom.body.appendChild(form);
                form.submit();
                this.dom.body.removeChild(form);
                var me = this;
                // when escape is pressed
                var escapeHandler = function(evt) {
                    evt = evt || window.event;
                    if (evt.keyCode == 27) {
                        me.dom.body.removeChild(iframe);
                        me.dom.onkeydown = null;
                    }
                };

                this.dom.onkeydown = escapeHandler;

            } else {
                var img = this.dom.createElement('img');
                img.alt = '';
                img.src = saveObjectURL
                        + encodeURIComponent(JSON.stringify(collectedObject));
                if (this.dom.body != undefined) {
                    this.dom.body.appendChild(img);
                }
            }

        }
    }
};
/**
 * Starts the collection and sending process now and ignoring the value of
 * collectingTrigger.
 */
DOM2JsonStruct.prototype.collectAndSendNow = function() {
    this.collectAndSend(this.currentTemplate, true);
};
/**
 * Checks if elemement is in array.
 * http://stackoverflow.com/questions/237104/array-containsobj-in-javascript
 * 
 * @param elem
 *                {object} the element to search
 * @param arr
 *                {Array} the array to search
 * @return {number} the index of the element of -1 if it was not found
 */
DOM2JsonStruct.prototype.inArray = function(elem, arr) {
    var len;
    var i = undefined;
    if (arr) {
        if ("indexOf" in arr) {
            return arr.indexOf(arr, elem);
        }
        len = arr.length;
        i = i ? i < 0 ? Math.max(0, len + i) : i : 0;
        for (; i < len; i++) {
            // Skip accessing in sparse arrays
            if (i in arr && arr[i] === elem) {
                return i;
            }
        }
    }
    return -1;
};

/**
 * Checks if the given object is an array.
 * {@link http://stackoverflow.com/questions/4775722/javascript-check-if-object-is-array}
 */
DOM2JsonStruct.prototype.isArray = function(obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]');
};

/**
 * This function returns the errors which were found during collecting the data
 * for a template. Internally they are saved in a map.
 * 
 * @param outputObject
 *                {object} An object that was returned by collectDataForTemplate
 * @throws Error
 *                 In case the object was not found
 * @return {Array} The errors which were found during collecting the data
 */
DOM2JsonStruct.prototype.validationErrors = function(outputObject) {
    if (outputObject in this.errors2outputObjects) {
        return this.errors2outputObjects[outputObject];
    } else {
        throw new Error("Object was not found in internal map. Double"
                + " check that it was received from collectDataForTemplate");
    }
};

/**
 * Sets the internal dom which is used to run the template against. By default
 * it will be set to window.document
 * 
 * @param dom
 *                {Document} The DOM which should be used to collect data
 */
DOM2JsonStruct.prototype.setDOM = function(dom) {
    this.dom = dom;
};
/**
 * Gets the internal dom representation
 * 
 * @return {Document} The current DOM
 */
DOM2JsonStruct.prototype.getDOM = function(dom) {
    return this.dom;
};

// add a toISOString function to the Date object
// if it is not available yet
// http://sharepointkunskap.wordpress.com/2011/12/19/format-javascript-date-in-iso-8601/
if (!Date.prototype.toISOString) {
    /**
     * Returns a date in ISO 8601 format: e.g. 2012-06-24T23:33:20.679+02:00
     * http://de.wikipedia.org/wiki/ISO_8601
     */
    Date.prototype.toISOString = function() {
        function pad(n) {
            return n < 10 ? '0' + n : n;
        }
        return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-'
                + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':'
                + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds())
                + 'Z';
    };
}

// https://github.com/douglascrockford/JSON-js/blob/master/json2.js
// Create JSON.stringify obejct if not available yet

/*
 * json2.js 2012-10-08
 * 
 * Public Domain.
 * 
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 * 
 * See http://www.JSON.org/js.html
 * 
 * 
 * This code should be minified before deployment. See
 * http://javascript.crockford.com/jsmin.html
 * 
 * USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
 * NOT CONTROL.
 * 
 * 
 * This file creates a global JSON object containing two methods: stringify and
 * parse.
 * 
 * JSON.stringify(value, replacer, space) value any JavaScript value, usually an
 * object or array.
 * 
 * replacer an optional parameter that determines how object values are
 * stringified for objects. It can be a function or an array of strings.
 * 
 * space an optional parameter that specifies the indentation of nested
 * structures. If it is omitted, the text will be packed without extra
 * whitespace. If it is a number, it will specify the number of spaces to indent
 * at each level. If it is a string (such as '\t' or '&nbsp;'), it contains the
 * characters used to indent at each level.
 * 
 * This method produces a JSON text from a JavaScript value.
 * 
 * When an object value is found, if the object contains a toJSON method, its
 * toJSON method will be called and the result will be stringified. A toJSON
 * method does not serialize: it returns the value represented by the name/value
 * pair that should be serialized, or undefined if nothing should be serialized.
 * The toJSON method will be passed the key associated with the value, and this
 * will be bound to the value
 * 
 * For example, this would serialize Dates as ISO strings.
 * 
 * Date.prototype.toJSON = function (key) { function f(n) { // Format integers
 * to have at least two digits. return n < 10 ? '0' + n : n; }
 * 
 * return this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' +
 * f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' +
 * f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z'; };
 * 
 * You can provide an optional replacer method. It will be passed the key and
 * value of each member, with this bound to the containing object. The value
 * that is returned from your method will be serialized. If your method returns
 * undefined, then the member will be excluded from the serialization.
 * 
 * If the replacer parameter is an array of strings, then it will be used to
 * select the members to be serialized. It filters the results such that only
 * members with keys listed in the replacer array are stringified.
 * 
 * Values that do not have JSON representations, such as undefined or functions,
 * will not be serialized. Such values in objects will be dropped; in arrays
 * they will be replaced with null. You can use a replacer function to replace
 * those with JSON values. JSON.stringify(undefined) returns undefined.
 * 
 * The optional space parameter produces a stringification of the value that is
 * filled with line breaks and indentation to make it easier to read.
 * 
 * If the space parameter is a non-empty string, then that string will be used
 * for indentation. If the space parameter is a number, then the indentation
 * will be that many spaces.
 * 
 * Example:
 * 
 * text = JSON.stringify(['e', {pluribus: 'unum'}]); // text is
 * '["e",{"pluribus":"unum"}]'
 * 
 * 
 * text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t'); // text is
 * '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'
 * 
 * text = JSON.stringify([new Date()], function (key, value) { return this[key]
 * instanceof Date ? 'Date(' + this[key] + ')' : value; }); // text is
 * '["Date(---current time---)"]'
 * 
 * 
 * JSON.parse(text, reviver) This method parses a JSON text to produce an object
 * or array. It can throw a SyntaxError exception.
 * 
 * The optional reviver parameter is a function that can filter and transform
 * the results. It receives each of the keys and values, and its return value is
 * used instead of the original value. If it returns what it received, then the
 * structure is not modified. If it returns undefined then the member is
 * deleted.
 * 
 * Example: // Parse the text. Values that look like ISO date strings will // be
 * converted to Date objects.
 * 
 * myData = JSON.parse(text, function (key, value) { var a; if (typeof value ===
 * 'string') { a =
 * /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
 * if (a) { return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5],
 * +a[6])); } } return value; });
 * 
 * myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) { var d; if
 * (typeof value === 'string' && value.slice(0, 5) === 'Date(' &&
 * value.slice(-1) === ')') { d = new Date(value.slice(5, -1)); if (d) { return
 * d; } } return value; });
 * 
 * 
 * This is a reference implementation. You are free to copy, modify, or
 * redistribute.
 */

/* jslint evil: true, regexp: true */

/*
 * members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply, call,
 * charCodeAt, getUTCDate, getUTCFullYear, getUTCHours, getUTCMinutes,
 * getUTCMonth, getUTCSeconds, hasOwnProperty, join, lastIndex, length, parse,
 * prototype, push, replace, slice, stringify, test, toJSON, toString, valueOf
 */

// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.
if (typeof JSON !== 'object') {
    JSON = {};
}

(function() {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function(key) {

            return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-'
                    + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate())
                    + 'T' + f(this.getUTCHours()) + ':'
                    + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds())
                    + 'Z' : null;
        };

        String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function(
                key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = { // table
        // of
        // character
        // substitutions
        '\b' : '\\b',
        '\t' : '\\t',
        '\n' : '\\n',
        '\f' : '\\f',
        '\r' : '\\r',
        '"' : '\\"',
        '\\' : '\\\\'
    }, rep;

    function quote(string) {

        // If the string contains no control characters, no quote characters,
        // and no
        // backslash characters, then we can safely slap some quotes around it.
        // Otherwise we must also replace the offending characters with safe
        // escape
        // sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"'
                + string.replace(escapable,
                        function(a) {
                            var c = meta[a];
                            return typeof c === 'string' ? c : '\\u'
                                    + ('0000' + a.charCodeAt(0).toString(16))
                                            .slice(-4);
                        }) + '"' : '"' + string + '"';
    }

    function str(key, holder) {

        // Produce a string from holder[key].

        var i, // The loop counter.
        k, // The member key.
        v, // The member value.
        length, mind = gap, partial, value = holder[key];

        // If the value has a toJSON method, call it to obtain a replacement
        // value.

        if (value && typeof value === 'object'
                && typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

        // If we were called with a replacer function, then call the replacer to
        // obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

        // What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

            // JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.

            return String(value);

            // If the type is 'object', we might be dealing with an object or an
            // array or
            // null.

        case 'object':

            // Due to a specification blunder in ECMAScript, typeof null is
            // 'object',
            // so watch out for that case.

            if (!value) {
                return 'null';
            }

            // Make an array to hold the partial results of stringifying this
            // object value.

            gap += indent;
            partial = [];

            // Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

                // The value is an array. Stringify every element. Use null as a
                // placeholder
                // for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

                // Join all of the elements together, separated with commas, and
                // wrap them in
                // brackets.

                v = partial.length === 0 ? '[]' : gap ? '[\n' + gap
                        + partial.join(',\n' + gap) + '\n' + mind + ']' : '['
                        + partial.join(',') + ']';
                gap = mind;
                return v;
            }

            // If the replacer is an array, use it to select the members to be
            // stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

                // Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

            // Join all of the member texts together, separated with commas,
            // and wrap them in braces.

            v = partial.length === 0 ? '{}' : gap ? '{\n' + gap
                    + partial.join(',\n' + gap) + '\n' + mind + '}' : '{'
                    + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

    // If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function(value, replacer, space) {

            // The stringify method takes a value and an optional replacer, and
            // an optional
            // space parameter, and returns a JSON text. The replacer can be a
            // function
            // that can replace values, or an array of strings that will select
            // the keys.
            // A default replacer method can be provided. Use of the space
            // parameter can
            // produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

            // If the space parameter is a number, make an indent string
            // containing that
            // many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

                // If the space parameter is a string, it will be used as the
                // indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

            // If there is a replacer, it must be a function or an array.
            // Otherwise, throw an error.

            rep = replacer;
            if (replacer
                    && typeof replacer !== 'function'
                    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.

            return str('', {
                '' : value
            });
        };
    }

    // If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function(text, reviver) {

            // The parse method takes a text and an optional reviver function,
            // and returns
            // a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

                // The walk method is used to recursively walk the resulting
                // structure so
                // that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }

            // Parsing happens in four stages. In the first stage, we replace
            // certain
            // Unicode characters with escape sequences. JavaScript handles many
            // characters
            // incorrectly, either silently deleting them, or treating them as
            // line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx,
                        function(a) {
                            return '\\u'
                                    + ('0000' + a.charCodeAt(0).toString(16))
                                            .slice(-4);
                        });
            }

            // In the second stage, we run the text against regular expressions
            // that look
            // for non-JSON patterns. We are especially concerned with '()' and
            // 'new'
            // because they can cause invocation, and '=' because it can cause
            // mutation.
            // But just to be safe, we want to reject all unexpected forms.

            // We split the second stage into 4 regexp operations in order to
            // work around
            // crippling inefficiencies in IE's and Safari's regexp engines.
            // First we
            // replace the JSON backslash pairs with '@' (a non-JSON character).
            // Second, we
            // replace all simple value tokens with ']' characters. Third, we
            // delete all
            // open brackets that follow a colon or comma or that begin the
            // text. Finally,
            // we look to see that the remaining characters are only whitespace
            // or ']' or
            // ',' or ':' or '{' or '}'. If that is so, then the text is safe
            // for eval.

            if (/^[\],:{}\s]*$/
                    .test(text
                            .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                            .replace(
                                    /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
                                    ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

                // In the third stage we use the eval function to compile the
                // text into a
                // JavaScript structure. The '{' operator is subject to a
                // syntactic ambiguity
                // in JavaScript: it can begin a block or an object literal. We
                // wrap the text
                // in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

                // In the optional fourth stage, we recursively walk the new
                // structure, passing
                // each name/value pair to a reviver function for possible
                // transformation.

                return typeof reviver === 'function' ? walk({
                    '' : j
                }, '') : j;
            }

            // If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
