test(
        "dom2jsonstruct GUI",
        function() {
            var dom2structGUI = new DOM2JsonStructGUI(document.body);

            var simpleCart = {
                billingAddress : {
                    givenName : {
                        __dom2jsonstruct : {
                            "valueType" : "constant"
                        }
                    },
                    familyName : {}
                },
                lineItems : [ {
                    name : {},
                    price : {}
                } ],
                total : {}
            };

            dom2structGUI.populateTreeFromTemplate(simpleCart);
            ok(dom2structGUI, "Was initiated");

            var jqTreeData = dom2structGUI.getTreeViewData();

            deepEqual(jqTreeData, [ {
                name : "billingAddress",
                children : [ {
                    name : "givenName",
                    id : 1,
                    variableName : "billingAddress.givenName"
                }, {
                    name : "familyName",
                    id : 2,
                    variableName : "billingAddress.familyName"
                } ]
            }, {
                name : "lineItems",
                children : [ {
                    name : "0",
                    children : [ {
                        name : "name",
                        id : 3,
                        variableName : "lineItems.0.name"
                    }, {
                        name : "price",
                        id : 4,
                        variableName : "lineItems.0.price"
                    }, ]
                } ]
            }, {
                name : "total",
                id : 5,
                variableName : "total"
            }

            ], "jqData generated");

            try {
            var cssSelector = dom2structGUI
                    .getSelectorFromElement(jQuery("#qunit-test-output0 .test-name")[0]);
            } catch(e) {
                console.log("Could not get element. "+e);
                fail();
            }
            ok(
                    "#qunit-test-output0 > STRONG:nth-child(1) > SPAN:nth-child(1)" == cssSelector,
                    "Selector did work");

            equal(
                    dom2structGUI.getJSONTemplate(),
                    "{\"billingAddress\":{\"givenName\":{\"__dom2jsonstruct\":{\"valueType\":\"constant\"}},\"familyName\":{}},\"lineItems\":[{\"name\":{},\"price\":{}}],\"total\":{}}",
                    "JSON Returned template");

            dom2structGUI.enableOtherTemplate();

            equal(undefined, dom2structGUI.getSelectedNode());

            dom2structGUI.selectWizardStep(2, true);

            equal(2, dom2structGUI.getSelectedNode().id);

            dom2structGUI.setPropertyInTemplate("selector",
                    "#qunit-test-output0 .test-name");

            equal(
                    dom2structGUI.getJSONTemplate(),
                    "{\"billingAddress\":{\"givenName\":{\"__dom2jsonstruct\":{\"valueType\":\"constant\"}},\"familyName\":{\"__dom2jsonstruct\":{\"selector\":\"#qunit-test-output0 .test-name\"}}},\"lineItems\":[{\"name\":{},\"price\":{}}],\"total\":{}}",
                    "JSON Returned template");

            var complexCart = {
                __dom2jsonstruct : {
                    "useWizard" : true,
                    "triggerCollecting" : function() {
                        return true;
                    },
                    "postValidate" : function(objectTree) {
                        if (objectTree.lineItems.length == 0) {
                            var err = new Error(
                                    "Could not collect any lineItems.");
                            err.rethrow = true;
                            throw err;
                        }
                    }
                },
                billingAddress : {
                    givenName : {
                        __dom2jsonstruct : {
                            "valueType" : "constant"
                        }
                    },
                    familyName : {
                        __dom2jsonstruct : {
                            "preSetProcessing" : function(value) {
                                return value;
                            },
                            "preValidate" : function(value) {
                                if (!value || /^\s*$/.test(value)) {
                                    var err = new Error("String is empty.");
                                    // err.rethrow = true;
                                    throw err;
                                }
                            }
                        }
                    }
                },
                lineItems : [ {
                    name : {
                        __dom2jsonstruct : {
                            "valueType" : "singleString"
                        }
                    },
                    price : {
                        __dom2jsonstruct : {
                            "valueType" : "regexFloat"
                        }
                    }
                } ],
                total : {
                    __dom2jsonstruct : {
                        "selector" : "#qunit-header > A:nth-child(1)"
                    }
                }
            };
            dom2structGUI.populateTreeFromTemplate(complexCart);
            var jsonStringTemplate = dom2structGUI.getJSONTemplate();
            // console.log(JSON.stringify(jsonStringTemplate));
            equal(
                    jsonStringTemplate,
                    "{\"__dom2jsonstruct\":{\"useWizard\":true,\"triggerCollecting\":function () {\r\n                        return true;\r\n                    },\"postValidate\":function (objectTree) {\r\n                        if (objectTree.lineItems.length == 0) {\r\n                            var err = new Error(\r\n                                    \"Could not collect any lineItems.\");\r\n                            err.rethrow = true;\r\n                            throw err;\r\n                        }\r\n                    }},\"billingAddress\":{\"givenName\":{\"__dom2jsonstruct\":{\"valueType\":\"constant\"}},\"familyName\":{\"__dom2jsonstruct\":{\"preSetProcessing\":function (value) {\r\n                                return value;\r\n                            },\"preValidate\":function (value) {\r\n                                if (!value || /^\\s*$/.test(value)) {\r\n                                    var err = new Error(\"String is empty.\");\r\n                                    // err.rethrow = true;\r\n                                    throw err;\r\n                                }\r\n                            }}}},\"lineItems\":[{\"name\":{\"__dom2jsonstruct\":{\"valueType\":\"singleString\"}},\"price\":{\"__dom2jsonstruct\":{\"valueType\":\"regexFloat\"}}}],\"total\":{\"__dom2jsonstruct\":{\"selector\":\"#qunit-header > A:nth-child(1)\"}}}",
                    "Template was exported same way imported");
        });