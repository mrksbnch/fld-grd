(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define('FldGrd', ['module', 'exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports);
        global.FldGrd = mod.exports;
    }
})(this, function (module, exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    /*------------------------------------*\
        #FLD-GRD 1.1.1
    \*------------------------------------*/
    /**
     * Defaults
     *
     * @type {object}
     */
    var defaults = {
        /**
         * Maximum row height
         *
         * @type {integer}
         */
        rowHeight: 250,

        /**
         * Give "orphans" — elements in the last row that do not form a complete row — a specific
         * height. By default, "orphans" will have the average height of the other rows
         *
         * @type   {function}
         * @param  {object}   rows
         * @param  {Number}   rows.heightAvg Average height
         * @param  {Array}    rows.heights   Height of all rows
         * @return {Number}
         */
        rowHeightOrphan: function rowHeightOrphan(rows) {
            return Math.round(rows.heightAvg);
        },

        /**
         * CSS Selector for fluid grid items. It's useful if you also have other elements in your
         * container that shouldn't be treated as grid items
         *
         * @type {String}
         */
        itemSelector: '*',

        /**
         * CSS Selector for objects inside grid items. `width` and `height` is applied to this element
         *
         * @type {String}
         */
        objSelector: 'img',

        /**
         * Specify data attribute names that are used to determine the dimensions for each item
         *
         * @type {String}
         */
        dataWidth: 'data-fld-width',
        dataHeight: 'data-fld-height'
    };

    /**
     * Get direct children that match the given selector.
     * Based on http://blog.wearecolony.com/a-year-without-jquery/
     *
     * @param   {element}   el
     * @param   {String}    selector
     * @return  {element[]}
     */
    function queryChildren(el, selector) {
        var childSelectors = [];
        var selectors = null;
        var children = null;
        var tempId = null;

        selectors = selector.split(',');

        if (!el.id) {
            tempId = '_temp_' + Math.random().toString(36).substr(2, 10);

            el.setAttribute('id', tempId);
        }

        while (selectors.length) {
            childSelectors.push('#' + el.id + ' > ' + selectors.pop());
        }

        children = document.querySelectorAll(childSelectors.join(', '));

        if (tempId) {
            el.removeAttribute('id');
        }

        return children;
    }

    /**
     * Copy the values of all enumerable own properties from one or more source
     * objects to a target object
     *
     * @param  {object} target
     * @return {object} output
     */
    function extend(target) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        var output = Object(target);

        Object.keys(args).forEach(function (arg) {
            if (args[arg] !== undefined && args[arg] !== null) {
                Object.keys(args[arg]).forEach(function (key) {
                    output[key] = args[arg][key];
                });
            }
        });

        return output;
    }

    /**
     * Fluid Grid constructor
     *
     * @param {element} el
     * @param {object}  [options]
     * @constructor
     */
    var FldGrd = function FldGrd(el, options) {
        if (!(el instanceof Element)) {
            throw new Error('`el` is not an element');
        }

        this.el = el;
        this.items = [];

        this._props = {
            gutter: null,
            pendingResize: false
        };
        this._bind = {};
        this._settings = extend({}, defaults, options);

        // Automatically initialize instance
        this._init();

        return this;
    };

    FldGrd.prototype = {
        /**
         * @private
         * @return  {void}
         */
        _init: function init() {
            this._setup();
            this._attachEventListeners();
            this.update();
        },

        /**
         * Calculate gutter width and dimesions for each item
         *
         * @private
         * @return {void}
         */
        _setup: function setup() {
            var elItems = null;
            var itemWidth = null;
            var itemHeight = null;
            var itemLength = null;
            var computedStyle = null;
            var i = 0;

            elItems = queryChildren(this.el, this._settings.itemSelector);
            itemLength = elItems.length;
            computedStyle = getComputedStyle(elItems[0], null);

            // Calculate gutter width
            this._props.gutter += parseInt(computedStyle.marginLeft, 10) || 0;
            this._props.gutter += parseInt(computedStyle.marginRight, 10) || 0;
            this._props.gutter += parseInt(computedStyle.paddingLeft, 10) || 0;
            this._props.gutter += parseInt(computedStyle.paddingRight, 10) || 0;

            for (; i < itemLength; i++) {
                itemWidth = parseInt(elItems[i].getAttribute(this._settings.dataWidth), 10);
                itemHeight = parseInt(elItems[i].getAttribute(this._settings.dataHeight), 10);

                // Ignore items with no or invalid data attribute values
                if (isNaN(itemWidth) || isNaN(itemHeight)) {
                    continue;
                }

                this.items.push({
                    width: itemWidth,
                    normWidth: itemWidth * (this._settings.rowHeight / itemHeight),
                    height: itemHeight,
                    el: elItems[i].querySelector(this._settings.objSelector)
                });
            }
        },

        /**
         * Make/update grid. This is where the "magic" happens
         *
         * @return {object} instance
         */
        update: function update() {
            var gridWidth = this.el.clientWidth;
            var itemLength = this.items.length;
            var rowHeightArray = [];
            var rowFirstItem = 0;
            var rowWidth = 0;
            var rowMaxWidth = 0;
            var rowGutterWidth = 0;
            var rowHeight = 0;
            var rowHeightTotal = 0;
            var rowRatio = 0;
            var itemWidth = 0;
            var itemIsLast = false;
            var i = 0;
            var x = 0;

            for (; i < itemLength; i++) {
                rowWidth += this.items[i].normWidth;
                rowGutterWidth += this._props.gutter;
                itemIsLast = i === itemLength - 1;

                if (rowWidth + rowGutterWidth >= gridWidth || itemIsLast) {
                    // Since gutters always have the same width (regardless of `rowHeight`), we
                    // need to exclude them from the calculations
                    rowMaxWidth = gridWidth - rowGutterWidth;

                    if (rowMaxWidth / rowWidth > 1 && itemIsLast) {
                        // Use a different height for orphan elements
                        rowHeight = this._settings.rowHeightOrphan.call(this, {
                            heightAvg: rowHeightTotal / rowHeightArray.length,
                            heights: rowHeightArray
                        });
                        rowRatio = rowHeight / this._settings.rowHeight;
                    } else {
                        rowRatio = Math.min(rowMaxWidth / rowWidth, 1);
                        rowHeight = Math.floor(rowRatio * this._settings.rowHeight);
                    }

                    rowHeightArray.push(rowHeight);
                    rowHeightTotal += rowHeight;

                    for (x = rowFirstItem; x <= i; x++) {
                        // We need to substract `1` to prevent some resize issues in Firefox and
                        // Safari. Need to find a better way to solve this...
                        itemWidth = Math.floor(rowRatio * this.items[x].normWidth) - 1;

                        this.items[x].el.style.width = itemWidth + 'px';
                        this.items[x].el.style.height = rowHeight + 'px';
                    }

                    // Reset row variables
                    rowWidth = 0;
                    rowGutterWidth = 0;
                    rowFirstItem = i + 1;
                }
            }

            // Reset tick
            this._props.pendingResize = false;

            return this;
        },

        /**
         * Attach event listeners
         *
         * @return  {void}
         * @private
         */
        _attachEventListeners: function addEventListener() {
            this._bind.resize = this._handleResize.bind(this);

            window.addEventListener('resize', this._bind.resize);
        },

        /**
         * Fired when browser window is resized
         *
         * @private
         * @param   {object} e
         * @return  {void}
         */
        _handleResize: function handleResize() {
            // Throttle resize
            if (!this._props.pendingResize) {
                this._props.pendingResize = true;
                window.requestAnimationFrame(this.update.bind(this));
            }
        },

        /**
         * Destroy fluid grid instance
         *
         * @return {void}
         */
        destroy: function destroy() {
            window.removeEventListener('resize', this._bind.resize);

            this.el = this.items = this._bind = this._settings = this._handlers = null;
        }
    };

    exports.default = FldGrd;
    module.exports = exports['default'];
});