/**!
 * SelectionMenu 3.2.0
 *
 * Displays a context menu when the user selects some text on the page
 * https://github.com/idorecall/selectionmenu
 *
 * @author	[Dan Dascalescu](http://github.com/dandv) for iDoRecall
 * @license MIT
 *
 * Inspired by work by Mathias Schäfer (aka molily) - http://github.com/molily/selectionmenu
 */

'use strict';

// https://github.com/umdjs/umd/blob/master/amdWeb.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.SelectionMenu = factory();
    }
}(this, function () {
    function LongTouch(func) {
        var timer;
        var touchduration = 300; //length of time we want the user to touch before we do something
        let event = undefined;
        this.touchstart = function (e) {
            event = e;
            // e.preventDefault();
            if (!timer) {
                timer = setTimeout(() => func(e), touchduration);
            }
        }

        this.touchend = function (e) {
            event = e;
            //stops short touches from firing the event
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }
    }

    LongTouch.prototype = {
        start: function () {
            window.addEventListener("touchstart", this.touchstart.bind(this), false);
            window.addEventListener("touchend", this.touchend.bind(this), false);
        },
        end: function () {
            window.removeEventListener("touchstart", this.touchstart.bind(this), false);
            window.removeEventListener("touchend", this.touchend.bind(this), false);
        }
    }

    /**
     * @typedef {object} rectangle
     * @property {number} top
     * @property {number} right
     * @property {number} bottom
     * @property {number} left
     * @property {number} width
     * @property {number} height
     */

    /**
     * Add the window scroll position to a rectangle
     * @param {rectangle} rect - The rectangle to add scroll position to.
     * @returns {rectangle} The rectangle with absolute coordinates relative to the window's top-left corner.
     */
    function addScroll(rect) {
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            bottom: rect.bottom + window.pageYOffset,
            right: rect.right + window.window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    }

    function lerp(v0, v1, t) {
        return v0 * (1 - t) + v1 * t
    }
    /**
     * Get the absolutely-positioned bounding rectangle (top, left, bottom, right, width, height) that contains the
     * selection, even if the selection crosses nodes and its start and end have different parents. Takes scrolling
     * into account.
     * Note that the native window.getSelection().getRangeAt(0).getBoundingClientRect() overshoots towards the end
     * if the selection spans nodes with different parents, e.g. a <p> and the next <h1>.
     * Inspiration: http://stackoverflow.com/questions/6846230/coordinates-of-selected-text-in-browser-page/6847328#6847328
     * See how Selection Range clientRects work at http://codepen.io/dandv/pen/bdxgVj
     * @param sel
     * @param {object} [options] - Optional parameter controlling the return of height and first/last rectangles
     * @param {boolean} [options.justHeight=false] - Return only the height (bypasses going through all the rectangles
     * that make up the selection)
     * @param {boolean} [options.first=false] - Return the first rectangle as well, in the `.first` key of an object
     * that will have `.rect` as well for the entire rectangle
     * @param {boolean} [options.last=false] - Return the last rectangle as well, in `.last`
     *
     * @returns {{rect: rectangle, first: rectangle, last: rectangle}}|number The rectangle(s) or the height
     */  // Ignore the WebStorm warning or lack thereof - https://youtrack.jetbrains.com/issue/WEB-17506

    function getSelectionBoundingRect(sel, options) {
        sel = sel || window.getSelection();
        if (sel.rangeCount) {
            var range = sel.getRangeAt(0);
            if (range.getClientRects) {
                var rectangles = range.getClientRects();  // https://developer.mozilla.org/en-US/docs/Web/API/Element/getClientRects
                if (rectangles.length > 0) {
                    var r0 = rectangles[0], rlast = rectangles[rectangles.length - 1];
                    var rect = addScroll({
                        top: r0.top,
                        left: r0.left,
                        right: r0.right,
                        bottom: rlast.bottom
                    });
                    rect.height = rect.bottom - rect.top;
                    if (options.justHeight) return rect.height;

                    // A 3-line selection may start at the last word in the line, continue with a full line, and end
                    // after the first word of the next line. Its width is that of the middle line.
                    for (var i = 1; i < rectangles.length; i++) {
                        var ri = rectangles[i];
                        if (ri.left < rect.left) rect.left = ri.left;
                        if (ri.right > rect.right) rect.right = ri.right;
                    }

                    // Finally, calculate the width and height
                    rect.width = rect.right - rect.left;

                    // Return the first and last rectangles too, if requested
                    var ret = { rect: rect };
                    if (options.first) ret.first = addScroll(r0);
                    if (options.last) ret.last = addScroll(rlast);
                    return ret.first || ret.last ? ret : rect;
                } else {
                    // TODO return a rectangle as big as the container?
                }
            }
        }
    }

    /**
     * Create an absolutely-positioned element
     * @param clientRect
     * @param {boolean} [addScroll=false] Whether to add window.page[XY]Offset
     * @returns {Element}
     */
    function createAbsoluteElement(clientRect, addScroll) {
        var span = document.createElement('span');
        span.style.position = 'absolute';
        span.style.top = clientRect.top + (addScroll ? window.pageYOffset : 0) + 'px';
        span.style.left = clientRect.left + (addScroll ? window.pageXOffset : 0) + 'px';
        span.style.width = clientRect.width + 'px';
        span.style.height = clientRect.height + 'px';
        return span;
    }

    function getAbsoluteElement(clientRect, addScroll) {
        return {
            top: clientRect.top + (addScroll ? window.pageYOffset : 0),
            left: clientRect.left + (addScroll ? window.pageXOffset : 0),
            width: clientRect.width,
            height: clientRect.height,

        }
    }

    // Main constructor function
    function SelectionMenu(options) {
        var instance = this;

        // Copy members from the options object to the instance
        instance.id = options.id || 'selection-menu';  // TODO check if reused by multiple menus. Or return the menu from the constructor?

        instance.minlength = options.minlength || 5;
        instance.maxlength = options.maxlength || Infinity;
        instance.container = options.container;
        instance.handler = options.handler;
        instance.onselect = options.onselect;
        instance.debug = options.debug;  // TODO remove debugging after solving the triple-click Chrome issue
        instance.showingsCount = 0;
        instance.selectionStartElement = null;  // Track where the selection started, so that if the user releases the LMB slightly outside the container due to inertia near the edge,
        instance.selectionEndElement = null;  // we still pop up the menu - https://github.com/iDoRecall/selection-menu/issues/8
        instance.options = options;
        instance.windowSize = instance.container.getBoundingClientRect();
        // "Private" instance variables
        instance._span = null;  // a <span> that will roughly cover the selected text, and is destroyed on menu close
        instance.tether = null;  // HubSpot Tether DOM element that contains the actual menu; attached to the span
        instance.longPress = null;
        this.applySelections().then(x => {
            instance.setupEvents();
            window.addEventListener("resize", () => {
                instance.windowSize = instance.container.getBoundingClientRect();
                instance.setupEvents.bind(instance);

            });


        });
    }

    SelectionMenu.prototype = {
        escapeRegex: function (str) {
            return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        },
        highlight: function (str, ixs) {
            const html = ixs.reduceRight((s, ix) => `${s.slice(0, ix.start)}<span style="background-color:${ix.color}">${s.slice(ix.start, ix.end)}</span>${s.slice(ix.end)}`
                , str
            );
            return html
        },

        highlightText: function (x) {
            let inputText = this.container;
            let innerHTML = inputText.innerHTML;
            let regexp = new RegExp(this.escapeRegex(x.text), "gi")
            innerHTML = innerHTML.replace(regexp, `<span class='highlight' style='color:${x.color}'>$&</span>`)
            inputText.innerHTML = innerHTML;
        },
        applySelections: async function () {
            if (this.options.getSelections) {
                const selections = await this.options.getSelections();
                if (selections && selections.length > 0) {
                    selections.forEach(x => {
                        if (x.text)
                            this.highlightText(x);
                        else this.container.innerHTML = this.highlight(this.container.textContent, [x]);
                    })

                }
            }
        },

        collabsMenu: function () {
            const colMenu = this.menu.querySelector(".collapsedMenu");
            const seperator = this.menu.querySelector(".seperator");
            const children = [...this.menu.children].filter(x => !x.classList.contains("collapsedMenu") && !x.classList.contains("seperator"));
            colMenu.classList.toggle("hide");
            colMenu.style.maxHeight = (this.windowSize.height / 2);
            seperator.classList.toggle("leftArrow");
            children.forEach(x => x.classList.toggle("hide"));
            // instance.tether.position();
            this.selectLast();
        },
        build: function () {
            const instance = this;
            if (instance.menu)
                instance.menu.remove();

            instance.options.content = Object.assign(document.createElement("div"), { id: "mymenu", hidden: "hidden" })
            const collapsedMenu = Object.assign(document.createElement("div"), { className: "collapsedMenu" })
            collapsedMenu.classList.add("hide");
            const seperator = Object.assign(document.createElement("div"), { className: "seperator" })
            document.body.appendChild(instance.options.content)
            const maxItems = instance.options.maxItems ? instance.options.maxItems.bind(instance)() : 3;
            instance.options.menus.forEach((x, i) => {
                let link = Object.assign(document.createElement("a"), { href: "#", id: x.id });
                const icon = document.createElement("i");
                if (x.icon) {
                    icon.className = "icon"
                    icon.innerHTML = x.icon;
                    link.appendChild(icon);
                }
                link.innerHTML += x.text;
                if (instance.options.isMobile())
                    link.classList.add("mobile");

                if (i >= maxItems)
                    collapsedMenu.appendChild(link);
                else
                    instance.options.content.appendChild(link);
            });

            if (instance.options.menus.length > maxItems) {
                instance.options.content.appendChild(seperator);
                instance.options.content.appendChild(collapsedMenu);

            }

            // Initialization
            if (instance.options.content instanceof HTMLElement) {
                instance.menu = instance.options.content;

            } else {
                throw 'content must be specified';
            }
            instance.menu.className = 'selection-menu';
            instance.menu.style.position = 'absolute';
            instance.menu.style.top = '-9999px';  // visibility: hidden still leaves space in the layout
            instance.menu.style.zIndex = 16777271;
        },

        mouseOnMenu: function (event) {
            // Is the target element the menu, or contained in it?
            return this.tether && (event.target === this.tether.element || this.tether.element.contains(event.target));
        },

        /**
         * Show the menu
         * @param {MouseEvent} event
         */
        show: function (event) {
            var instance = this;
            instance.hide();
            // Abort if the selected text is too short or too long
            if (instance.selectedText.length < instance.minlength || instance.selectedText.length > instance.maxlength) {
                return;
            }
            if (!instance.selectionStartElement)
                return;
            var selRects = {};
            if (instance.selectionStartElement.tagName === 'TEXTAREA') {
                // TODO construct rectangle from caret position in textarea.selectionStart -> textarea.selectionEnd
                // TODO event.target.selectionDirection is provided by the browser
                console.log('Precise selection menu in textareas reqires textarea-caret-position');
                selRects.rect = addScroll(instance.selectionStartElement.getClientRects()[0]);
                selRects.first = selRects.last = selRects.rect;
            } else {
                // Get the start and end nodes of the selection
                var sel = window.getSelection();
                // Abort if we got bogus values
                if (!sel.anchorNode) return;
                // From https://github.com/xdamman/selection-sharer/blob/df6fbba6b49b1b59596fe7bfc5851fc7298c68cf/src/selection-sharer.js#L45
                // We can't detect backwards selection within the same node with range.endOffset < rangeStartOffset because they're always sorted
                var rangeTemp = document.createRange();
                rangeTemp.setStart(sel.anchorNode, sel.anchorOffset);
                rangeTemp.setEnd(sel.focusNode, sel.focusOffset);
                instance.selectionDirection = rangeTemp.collapsed ? 'backward' : 'forward';
                if (instance.debug) console.log('Showing menu for', instance.selectionDirection, 'selection');
                selRects = getSelectionBoundingRect(sel, { first: true, last: true });
            }
            // TODO handle contenteditable
            instance.build();
            // Call the onselect handler to give it a chance to modify the menu
            if (instance.onselect) instance.onselect.call(instance, event);

            instance._span = createAbsoluteElement(selRects.rect);

            instance._span.style.zIndex = '-99999';
            document.body.appendChild(instance._span);

            if (instance.debug) {
                console.log('Appended the overlay span');
                instance._span.style.backgroundColor = 'yellow';
                var sFirst = createAbsoluteElement(selRects.first);
                sFirst.className = 'selection-menu-debug';
                sFirst.style.backgroundColor = 'green';
                sFirst.style.zIndex = '-99999';
                document.body.appendChild(sFirst);

                var sLast = createAbsoluteElement(selRects.last);
                sLast.className = 'selection-menu-debug';
                sLast.style.backgroundColor = 'red';
                sLast.style.zIndex = '-99999';
                document.body.appendChild(sLast);

                console.log('Selection.rect:', selRects.rect);
                console.log('Selection.last:', selRects.last);
            }

            // Menu positioning - watch https://github.com/HubSpot/drop/issues/100#issuecomment-122701509 for better options
            // We're mirroring the out-of-bounds CSS classes for the Tether/Drop arrows theme for now

            instance.menu.hidden = false;
            instance.menu.style.visibility = 'visible';  // TODO add display: block, but what if the display was something else before `none`?
            if (instance.menu.querySelector(".seperator"))
                instance.menu.querySelector(".seperator").style.height = (instance.menu.getBoundingClientRect().height - (instance.options.isMobile() ? 0 : 15)) + "px";
            let attachment = instance.selectionDirection === 'forward' ? 'top center' : 'bottom center';
            let targetAttachment = instance.selectionDirection === 'forward' ? 'bottom right' : 'top left';
            let targetOffset = (instance.selectionDirection === 'forward'
                ? '0 ' + (selRects.last.right - selRects.rect.right) + 'px'
                : '0 ' + (selRects.first.left - selRects.rect.left) + 'px')
            if (instance.options.isMobile()) {
                const spanPos = getAbsoluteElement(selRects.rect)
                const mPos = instance.menu.getBoundingClientRect();
                let left = lerp(60, instance.windowSize.width - spanPos.left, 0.5) - (mPos.width / 2);
                if (left < (mPos.width / 2))
                    left = left + (mPos.width / 3);
                console.log(spanPos.left, left)
                attachment = 'bottom center';
                targetAttachment = 'top center';
                targetOffset = (spanPos.top < (mPos.height * 2) ? mPos.height + "px" : "0 ") + left + "px"

            }
            // TODO if (Tether in Window)
            instance.tether = new Tether({  // Tether playground: http://jsfiddle.net/dandv/33yndveL/
                classPrefix: 'tether-smenu',
                element: instance.menu,

                target: instance._span,
                attachment: attachment,
                targetAttachment: targetAttachment,

                targetOffset: targetOffset,
                constraints: [
                    {
                        to: 'scrollParent',
                        attachment: 'together'
                    },
                    {
                        to: 'window',
                        attachment: 'together'
                    }
                ],
                optimizations: {
                    // gpu: false,  // linked with the first positioning being 16px off due to the custom font loading - https://github.com/iDoRecall/selection-menu/issues/2 - but disabling this doesn't move the menu on subsequent showings
                    // moveElement: false,
                }
            });

            // Special processing when we first create the tether
            if (instance.showingsCount++ === 0) {
                // Reposition the first element because Tether may compute the offset incorrectly, e.g. with the arrows theme
                // Could be made more robust with a setTimeout if the need arises.
                instance.tether.position();
                const event = "click";
                instance.tether.element.addEventListener(event, function (e) {
                    const target = e.target;
                    if (target.classList.contains("seperator")) {
                        instance.collabsMenu();
                        return;
                    } else if (target.tagName.toLowerCase() != "a")
                        return;

                    instance.handler.call(instance, e);
                    instance.hide(true);
                });
                instance.menu.focus()
                // Register the handler for clicks on the menu. `element` will be the same across instances.
                // TODO pre-create the Tether, and only reposition onselect?

            }
        },

        getSelection: function getSelection(event) {
            try {
                if ('TEXTAREA' === event.target.tagName) {
                    var textarea = event.target;
                    // Save the selected text because clicking on the menu will blur the textarea and reset window.getSelection()
                    // Firefox bug reported in 2001 (!) breaks window.getSelection.() on textareas - https://bugzilla.mozilla.org/show_bug.cgi?id=85686
                    this.selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
                } else {
                    this.selection = window.getSelection()
                }
                this.rang = this.selection.getRangeAt(0).cloneRange();
                return this.selection.toString();
            } catch (e) {

            }
        },

        selectLast: function () {
            if (!this.selection)
                return;
            this.container.focus();
            const range = this.rang;
           // range.selectNodeContents(this.container)
           // range.collapse(true)
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

        },

        mouseDown: function (event) {
            const instance = this;
            if (instance.mouseOnMenu(event)) return;
            instance.selectionStartElement = event.target;
            // Hide the menu simply when the selection is hidden, regardless of which mouse button was pressed.
            window.setTimeout(function () {
                instance.selectedText = instance.getSelection(event);
                if (!instance.selectedText && instance._span) instance.hide();
            }, 100);
        },

        mouseUp: function (event) {
            const instance = this;
            if (instance.mouseOnMenu(event)) return;
            instance.selectionEndElement = event.target;
            // Let the menu's onclick execute first (if mouseOnMenu), handling the current selection...
            window.setTimeout(function () {
                // ...then recalculate the selection
                instance.selectedText = instance.getSelection(event);
                if (!instance.selectedText) return instance.hide();
                if (instance.container.contains(instance.selectionStartElement) || instance.container.contains(instance.selectionEndElement)) {
                    // Only show the menu if the selection started or ended within the container
                    instance.show(event);
                }
            }, 100);
            event.preventDefault()
        },

        touchend: function (e) {
            const instance = this;
            const target = e.target;
            const closest = target.closest(".selection-menu");
            if (target.classList.contains("selection-menu") || (closest)) {
                return;
            } else instance.hide();
        },

        setupEvents: function () {
            const instance = this;
            document.body.removeEventListener('mousedown', instance.mouseDown);
            document.body.removeEventListener('mouseup', instance.mouseUp);
            document.body.removeEventListener('touchend', instance.touchend);
            document.body.removeEventListener('touchstart', instance.mouseDown);
            instance.container.removeEventListener('contextmenu', instance.mouseUp);
            if (!this.options.isMobile()) {
                if (this.options.contextMenu == "click") {
                    document.body.addEventListener('mousedown', instance.mouseDown.bind(instance));
                    document.body.addEventListener('mouseup', instance.mouseUp.bind(instance));
                } else {
                    document.body.addEventListener('mousedown', instance.mouseDown.bind(instance));
                    instance.container.addEventListener("contextmenu", instance.mouseUp.bind(instance));
                    document.addEventListener('mouseup', instance.touchend.bind(instance), false);
                }
            } else {
                if (this.longPress)
                    this.longPress.end();
                this.longPress = new LongTouch(instance.mouseDown.bind(instance))
                this.longPress.start();
                //document.addEventListener('touchend', instance.touchend.bind(instance), false);
                document.addEventListener('click', instance.mouseUp.bind(instance), false);
                instance.container.addEventListener("contextmenu", instance.mouseUp.bind(instance));
            }

        },

        hide: function hide(hideSelection) {
            var instance = this;
            instance.showingsCount = 0;
            if (instance.debug) console.log('Hiding...');

            //instance.menu.hidden = true;

            // Remove the selection span
            if (instance._span) {
                document.body.removeChild(instance._span);
                instance._span = null;
            }

            // Remove the HubSpot Tether menu
            if (instance.tether) {
                instance.tether.destroy();
                instance.tether = null;
            }

            // Remove the selection if the browser hasn't removed it (e.g. if clicking on a menu link opens a new tab)...
            if (hideSelection) {
                var selection = window.getSelection();
                if (selection && selection.toString()) {
                    // ...  but only if there is one, to avoid this IE bug: http://stackoverflow.com/questions/16160996/could-not-complete-the-operation-due-to-error-800a025e/32409912#32409912
                    selection.removeAllRanges();
                }
            }
            if (instance.menu)
                instance.menu.remove();
        }

    };

    // Return the constructor function
    return SelectionMenu;

}));
