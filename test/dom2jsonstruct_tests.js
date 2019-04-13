test(
        "test full dom2jsonstruct binding",
        function() {

            throws(function() {
                outputList = dom2json.collectDataForTemplate("test");
            }, Error, "template must be an array or an object but is: string");

            var htmlDoc = document.implementation
                    .createHTMLDocument("My Test document");
            htmlDoc.body.innerHTML = '       <h1>Demo Store</h1>\n'
                    + '        <h2 class="cart-headline">Cart</h2>\n'
                    + '        <address class="billing">\n'
                    + '            <span class="given-name">Manuel</span>\n'
                    + '            <span class="family-name">Blechschmidt</span><br />\n'
                    + '        </address>\n'
                    + '        <table id="cart-table">\n'
                    + '            <thead>\n' + '                <tr>\n'
                    + '                    <th>name</th>\n'
                    + '                    <th>price</th>\n'
                    + '                </tr>\n' + '            </thead>\n'
                    + '            <tbody>\n' + '                <tr>\n'
                    + '                    <td>Jacket XXL blue</td>\n'
                    + '                    <td>150.00 €</td>\n'
                    + '                </tr>\n' + '                <tr>\n'
                    + '                    <td>Jacket L red</td>\n'
                    + '                    <td>100.00 €</td>\n'
                    + '                </tr>\n' + '            </tbody>\n'
                    + '            <tfoot>\n' + '                <tr>\n'
                    + '                    <td>Total</td>\n'
                    + '                    <td>250.00 €</td>\n'
                    + '                </tr>\n' + '            </tfoot>\n'
                    + '        </table>\n';

            // testing querySelectorAll function
            if ("querySelectorAll" in htmlDoc) {
                var results = htmlDoc
                        .querySelectorAll("address.billing .given-name");
                ok(results.length == 1,
                        "Found one entry for css query address.billing .given-name");
            }

            var cartBindingTemplate = {
                __dom2jsonstruct : {
                    // This function is executed after
                    // collecting data for the whole
                    // template.
                    // If rethrow is set at the error
                    // it will be directlty be rethrown
                    // to the caller so no output object
                    // will be created.
                    postValidate : function(objectTree) {
                        if (objectTree.lineItems.length == 0) {
                            var err = new Error(
                                    "Could not collect any lineItems.");
                            err.rethrow = true;
                            throw err;
                        }
                    }
                },

                label : {
                    __dom2jsonstruct : {
                        // This value will directly be copied to
                        // the output object
                        constantValue : "Cart"
                    }
                },
                currency : {
                    __dom2jsonstruct : {
                        constantValue : "EUR"
                    }
                },
                billingAddress : {
                    givenName : {
                        __dom2jsonstruct : {
                            // selector contains the CSS
                            // selector which will be used
                            // to find the node.
                            // innerHTML will be called to
                            // get the value.
                            selector : "address.billing .given-name"
                        }
                    },
                    familyName : {
                        __dom2jsonstruct : {
                            selector : "address.billing .family-name"
                        }
                    }
                },
                // because lineItems is an array
                // the system will also generate in the
                // final structure as an array
                // the CSS selectors are suposed to
                // return lists of elements
                lineItems : [ {
                    name : {
                        __dom2jsonstruct : {
                            // the name is always in the first
                            // column
                            selector : "table tbody tr td:nth-child(1)",
                            // this function is called
                            // after preSetProcessing and before
                            // setting the value. It is supposed
                            // to throw an exception if the value is
                            // invalid. If the exceptions contains
                            // a true stopProcessing property the system
                            // will stop continue processing
                            preValidate : function(value) {
                                if (!value || /^\s*$/.test(value)) {
                                    var err = new Error("String is empty.");
                                    // err.stopProcessing = true;
                                    throw err;
                                }
                            }
                        }
                    },
                    price : {
                        __dom2jsonstruct : {
                            // the price is always in the second
                            // column
                            selector : "table tbody tr td:nth-child(2)",
                            // if the preSetProcessing function is set
                            // it will be called on every node before
                            // adding the value to the output object.
                            preSetProcessing : function(domNode) {
                                // remove the euro sign from the price
                                return parseFloat(domNode.innerHTML.replace(
                                        / \u20ac/g, ''));
                            }
                        }
                    },
                    currency : {
                        __dom2jsonstruct : {
                            // use EUR as constant value
                            calculateValue : function(cart) {
                                return cart.currency;
                            }
                        }
                    }
                }
                // if here are more elements they will
                // be ignored and a warning is shown
                // on the console
                ],
                total : {
                    __dom2jsonstruct : {
                        // the calculateValue function
                        // gets a current copy of the already
                        // collected values as a reference
                        // this can be used to calculate the value
                        // of this field
                        calculateValue : function(alreadyCollected) {
                            var total = 0;
                            for ( var i = 0; i < alreadyCollected.lineItems.length; i++) {
                                total += alreadyCollected.lineItems[i].price;
                            }
                            return total;
                        }
                    }
                }
            };

            var dom2json = new DOM2JsonStruct(htmlDoc);
            dom2json.toggleDebug();
            var outputCart = dom2json
                    .collectDataForTemplate(cartBindingTemplate);
            var expectedCart = {
                billingAddress : {
                    givenName : "Manuel",
                    familyName : "Blechschmidt"
                },
                label : "Cart",
                currency : "EUR",
                lineItems : [ {
                    name : "Jacket XXL blue",
                    price : 150,
                    currency : "EUR"
                }, {
                    name : "Jacket L red",
                    price : 100,
                    currency : "EUR"
                } ],
                total : 250
            };

            delete outputCart.toString;

            deepEqual(outputCart, expectedCart,
                    "Output cart equals expected cart");

            var cartBindingTemplateNestedArray = {
                __dom2jsonstruct : {
                    postValidate : function(objectTree) {
                        if (objectTree.lineItems.length == 0) {
                            var err = new Error(
                                    "Could not collect any lineItems.");
                            err.rethrow = true;
                            throw err;
                        }
                    }
                },
                currency : {
                    __dom2jsonstruct : {
                        constantValue : "EUR"
                    }
                },
                lineItems : {
                    entry : [ {
                        name : {
                            __dom2jsonstruct : {
                                selector : "table tbody tr td:nth-child(1)",
                                preValidate : function(value) {
                                    if (!value || /^\s*$/.test(value)) {
                                        var err = new Error("String is empty.");
                                        // err.stopProcessing = true;
                                        throw err;
                                    }
                                }
                            }
                        },
                        price : {
                            __dom2jsonstruct : {
                                selector : "table tbody tr td:nth-child(2)",
                                preSetProcessing : function(domNode) {
                                    return parseFloat(domNode.innerHTML
                                            .replace(/ \u20ac/g, ''));
                                }
                            }
                        },
                        currency : {
                            __dom2jsonstruct : {
                                calculateValue : function(cart) {
                                    return cart.currency;
                                }
                            }
                        }
                    } ]
                }
            };

            var outputCartNestedArray = dom2json
                    .collectDataForTemplate(cartBindingTemplateNestedArray);
            var expectedCartNestedArray = {
                currency : "EUR",
                lineItems : {
                    entry : [ {
                        name : "Jacket XXL blue",
                        price : 150,
                        currency : "EUR"
                    }, {
                        name : "Jacket L red",
                        price : 100,
                        currency : "EUR"
                    } ]
                }
            };

            delete outputCartNestedArray.toString;

            deepEqual(outputCartNestedArray, expectedCartNestedArray,
                    "Output cart with nested array equals expected cart");

            var cartBindingTemplateWithSizeHint = {
                __dom2jsonstruct : {
                    postValidate : function(objectTree) {
                        if (objectTree.lineItems.length == 0) {
                            var err = new Error(
                                    "Could not collect any lineItems.");
                            err.rethrow = true;
                            throw err;
                        }
                    }
                },
                currency : {
                    __dom2jsonstruct : {
                        constantValue : "EUR"
                    }
                },
                lineItems : {
                    entry : [ {
                        currency : {
                            __dom2jsonstruct : {
                                calculateValue : function(cart) {
                                    return cart.currency;
                                },
                                arraySizeHint : function(pathInTemplate,
                                        sizzle, dom) {
                                    // take the length which is returned by the
                                    // second element
                                    return sizzle(
                                            pathInTemplate[pathInTemplate.length - 1].name.__dom2jsonstruct.selector,
                                            dom).length;
                                }
                            }
                        },
                        name : {
                            __dom2jsonstruct : {
                                selector : "table tbody tr td:nth-child(1)",
                                preValidate : function(value) {
                                    if (!value || /^\s*$/.test(value)) {
                                        var err = new Error("String is empty.");
                                        // err.stopProcessing = true;
                                        throw err;
                                    }
                                }
                            }
                        },
                        price : {
                            __dom2jsonstruct : {
                                selector : "table tbody tr td:nth-child(2)",
                                preSetProcessing : function(domNode) {
                                    return parseFloat(domNode.innerHTML
                                            .replace(/ \u20ac/g, ''));
                                }
                            }
                        }
                    } ]
                }
            };

            var outputCartWithSizeHint = dom2json
                    .collectDataForTemplate(cartBindingTemplateWithSizeHint);
            var expectedCartWithSizeHint = {
                currency : "EUR",
                lineItems : {
                    entry : [ {
                        name : "Jacket XXL blue",
                        price : 150,
                        currency : "EUR"
                    }, {
                        name : "Jacket L red",
                        price : 100,
                        currency : "EUR"
                    } ]
                }
            };

            delete outputCartWithSizeHint.toString;

            deepEqual(outputCartWithSizeHint, expectedCartWithSizeHint,
                    "Output cart equals expected cart");

            htmlDoc = document.implementation
                    .createHTMLDocument("My Test document");
            htmlDoc.body.innerHTML = '    <ol>\n' + '       <li>One</li>\n'
                    + '       <li>Two</li>\n' + '       <li>Three</li>\n'
                    + '    </ol>\n';

            var listTemplateBinding = [ {
                __dom2jsonstruct : {
                    selector : "li",
                    postValidate : function(objectTree) {
                        if (objectTree.length != 3) {
                            var err = new Error(
                                    "List does not contain exactly 3 items");
                            throw err;
                        }
                    }
                }
            } ];

            dom2json = new DOM2JsonStruct(htmlDoc);
            var outputList = dom2json
                    .collectDataForTemplate(listTemplateBinding);
            var expectedList = [ "One", "Two", "Three" ];

            deepEqual(outputList, expectedList,
                    "Output list equals expected list");

            htmlDoc = document.implementation
                    .createHTMLDocument("My Test document");
            htmlDoc.body.innerHTML = '    <ol>\n' + '       <li>One</li>\n'
                    + '       <li>Two</li>\n' + '    </ol>\n';

            dom2json.setDOM(htmlDoc);

            outputList = dom2json.collectDataForTemplate(listTemplateBinding);

            expectedList = [ "One", "Two" ];

            deepEqual(outputList, expectedList,
                    "Output list equals expected list");

            var validationErrors = dom2json.validationErrors(outputList);

            ok(validationErrors.length == 1, "One error was collected");
            ok(
                    validationErrors[0].message == "List does not contain exactly 3 items",
                    "message is correct");

            listTemplateBinding = [ {
                __dom2jsonstruct : {
                    selector : "li",
                    postValidate : function(objectTree) {
                        if (objectTree.length != 3) {
                            var err = new Error(
                                    "List does not contain exactly 3 items");
                            err.rethrow = true;
                            throw err;
                        }
                    }
                }
            } ];

            throws(function() {
                outputList = dom2json
                        .collectDataForTemplate(listTemplateBinding);
            }, Error, "List does not contain exactly 3 items");

            htmlDoc = document.implementation
                    .createHTMLDocument("My Test document");

            var htmlDocumentString = '       <h1>Demo Store</h1>\n'
                    + '        <h2 class="order-headline">Order No <span>001235487</span></h2>\n'
                    + '        <table id="order-table">\n'
                    + '            <thead>\n' + '                <tr>\n'
                    + '                    <th>name</th>\n'
                    + '                    <th>price</th>\n'
                    + '                </tr>\n' + '            </thead>\n'
                    + '            <tbody>\n' + '                <tr>\n'
                    + '                    <td>Jacket XXL blue</td>\n'
                    + '                    <td>150.00 €</td>\n'
                    + '                </tr>\n' + '                <tr>\n'
                    + '                    <td>Jacket L red</td>\n'
                    + '                    <td>100.00 €</td>\n'
                    + '                </tr>\n' + '            </tbody>\n'
                    + '            <tfoot>\n' + '                <tr>\n'
                    + '                    <td>Total</td>\n'
                    + '                    <td>250.00 €</td>\n'
                    + '                </tr>\n' + '            </tfoot>\n'
                    + '        </table>\n';
            htmlDoc.body.innerHTML = htmlDocumentString;

            var orderBindingTemplate = {
                __dom2jsonstruct : {
                    saveObjectURL : "https://www.example.com/create?object="
                },
                orderNo : {
                    __dom2jsonstruct : {
                        selector : ".order-headline span"
                    }

                },
                lineItems : [ {
                    name : {
                        __dom2jsonstruct : {
                            // the name is always in the first
                            // column
                            selector : "table tbody tr td:nth-child(1)",
                            // this function is called
                            // after preSetProcessing and before
                            // setting the value. It is supposed
                            // to throw an exception if the value is
                            // invalid. If the exceptions contains
                            // a true stopProcessing property the system
                            // will stop continue processing
                            preValidate : function(value) {
                                if (!value || /^\s*$/.test(value)) {
                                    var err = new Error("String is empty.");
                                    // err.stopProcessing = true;
                                    throw err;
                                }
                            }
                        }
                    },
                    // if calculated values are used
                    // like back references they must not
                    // be the first property in the list
                    orderNo : {
                        __dom2jsonstruct : {
                            calculateValue : function(alreadyCollected) {
                                return alreadyCollected.orderNo;
                            }
                        }
                    }
                } ]
            };

            dom2json.setDOM(htmlDoc);

            outputList = dom2json.collectDataForTemplate(orderBindingTemplate);

            var expectedOrder = {
                orderNo : "001235487",
                lineItems : [ {
                    name : "Jacket XXL blue",
                    orderNo : "001235487"
                }, {
                    name : "Jacket L red",
                    orderNo : "001235487"
                } ]
            };

            delete outputList.toString;

            deepEqual(outputList, expectedOrder, "Order is correctly mapped");

            outputList = dom2json.collectAndSend(orderBindingTemplate);

            var dom = dom2json.getDOM();

            equal(
                    dom.body.innerHTML,
                    htmlDocumentString
                            + '<img alt="" src="https://www.example.com/create?object=%7B%22orderNo%22%3A%22001235487%22%2C%22lineItems%22%3A%5B%7B%22name%22%3A%22Jacket%20XXL%20blue%22%2C%22orderNo%22%3A%22001235487%22%7D%2C%7B%22name%22%3A%22Jacket%20L%20red%22%2C%22orderNo%22%3A%22001235487%22%7D%5D%7D">',
                    "Sending image was correctly inserted");

            orderBindingTemplate["__dom2jsonstruct"] = {
                "triggerCollecting" : function() {
                    return false;
                }
            };

            outputList = dom2json.collectDataForTemplate(orderBindingTemplate);

            deepEqual(outputList, undefined,
                    "Trigger collecting was set to false");

            var deeplyNestedTemplate = {
                array : {
                    variable : {
                        nextvariable : {
                            innerArray : [ {
                                firstElement : {
                                    innertFirstElement : {
                                        evenMoreInner : {
                                            __dom2jsonstruct : {
                                                selector : ".order-headline span"
                                            }
                                        }
                                    }
                                }
                            } ]
                        }
                    }
                }
            };
            outputList = dom2json.collectDataForTemplate(deeplyNestedTemplate);
            delete outputList.toString;
            deepEqual(outputList, {
                array : {
                    variable : {
                        nextvariable : {
                            innerArray : [ {
                                firstElement : {
                                    innertFirstElement : {
                                        evenMoreInner : "001235487"
                                    }
                                }
                            } ]
                        }
                    }
                }
            }, "Deeply nested test works");
            
            // SEMRECSYS-818
            var calculateValueForArrayTemplate = {
                    array : [
                               { "entry" : {
                                   "__dom2jsonstruct" : {
                                       calculateValue : function (alreadyCollected) {
                                           return ["one", "two"];
                                       }
                                   }
                                   
                               }
                               }
                             ]
            };
            
            outputList = dom2json.collectDataForTemplate(calculateValueForArrayTemplate);
            delete outputList.toString;
            deepEqual(outputList, {
                array : [{"entry" : "one"}, {"entry" : "two"}]
            }, "calculateValueForArrayTemplate works without calling innerHTML");
            
            var calculateValueForArrayTemplate = {
                    array : [
                               {
                                   "__dom2jsonstruct" : {
                                       calculateValue : function (alreadyCollected) {
                                           return ["one", "two"];
                                       }
                                   }
                               }
                             ]
            };
            
            outputList = dom2json.collectDataForTemplate(calculateValueForArrayTemplate);
            delete outputList.toString;
            deepEqual(outputList, {
                array : ["one", "two"]
            }, "calculateValueForArrayTemplate directly generates array");

            var calculateValueForArrayTemplate = {
                    "array" : {
                        "myfield" : {
                            "__dom2jsonstruct" : {
                                calculateValue : function (alreadyCollected) {
                                    return "test";
                                }
                            }
                        },
                        "otherfield" : [
                               {
                                   "__dom2jsonstruct" : {
                                       calculateValue : function (alreadyCollected) {
                                           return ["one", "two"];
                                       }
                                   }
                               }
                             ]
                    }
            };
            
            outputList = dom2json.collectDataForTemplate(calculateValueForArrayTemplate);
            delete outputList.toString;
            deepEqual(outputList, {
                "array" : {
                    "myfield" : "test",
                    "otherfield" : ["one", "two"]
                }
            }, "calculateValueForArrayTemplate directly generates array");
            
        });