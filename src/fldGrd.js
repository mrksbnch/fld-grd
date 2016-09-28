/*------------------------------------*\
    #FLD-GRD 1.2.0
\*------------------------------------*/
/**
 * Defaults
 *
 * @type {Object}
 */
const defaults = {
    /**
     * Maximum row height
     *
     * @type {Integer}
     */
    rowHeight: 250,

    /**
     * Give "orphans" — elements in the last row that do not form a complete row — a specific
     * height. By default, "orphans" will have the average height of the other rows
     *
     * @type   {Function}
     * @param  {Object}   rows
     * @param  {number}   rows.heightAvg Average row height
     * @param  {Array}    rows.heights   Height of all rows
     * @return {number}
     */
    rowHeightOrphan: rows => Math.round(rows.heightAvg),

    /**
     * CSS Selector for fluid grid items. It's useful if you also have other elements in your
     * container that shouldn't be treated as grid items
     *
     * @type {string}
     */
    itemSelector: '*',

    /**
     * CSS Selector for objects inside grid items. `width` and `height` is applied to this element
     *
     * @type {string}
     */
    objSelector: 'img',

    /**
     * Specify data attribute names that are used to determine the dimensions for each item
     *
     * @type {string}
     */
    dataWidth: 'data-fld-width',
    dataHeight: 'data-fld-height',
};


/**
 * Get direct children that match the given selector.
 * Based on http://blog.wearecolony.com/a-year-without-jquery/
 *
 * @param   {Element}   el
 * @param   {string}    selector
 * @return  {Element[]}
 */
function queryChildren(el, selector) {
    const childSelectors = [];
    let selectors = null;
    let children = null;
    let tempId = null;

    selectors = selector.split(',');

    if (!el.id) {
        tempId = `_temp_${Math.random().toString(36).substr(2, 10)}`;

        el.setAttribute('id', tempId);
    }

    while (selectors.length) {
        childSelectors.push(`#${el.id} > ${selectors.pop()}`);
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
 * @param  {Object} target
 * @return {Object} output
 */
function extend(target, ...args) {
    const output = Object(target);

    Object.keys(args).forEach((arg) => {
        if (args[arg] !== undefined && args[arg] !== null) {
            Object.keys(args[arg]).forEach((key) => {
                output[key] = args[arg][key];
            });
        }
    });

    return output;
}


/**
 * Fluid Grid constructor
 *
 * @param {Element} el
 * @param {Object}  [options]
 * @constructor
 */
const FldGrd = function FldGrd(el, options) {
    if (!(el instanceof Element)) {
        throw new Error('`el` is not an element');
    }

    this.el = el;
    this.items = [];

    this._props = {
        gutter: null,
        pendingResize: false,
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
     * @return  {Void}
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
     * @return {Void}
     */
    _setup: function setup() {
        let elItems = null;
        let itemWidth = null;
        let itemHeight = null;
        let itemLength = null;
        let computedStyle = null;
        let i = 0;

        elItems = queryChildren(this.el, this._settings.itemSelector);
        itemLength = elItems.length;
        computedStyle = getComputedStyle(elItems[0], null);

        // Calculate gutter width
        this._props.gutter += parseInt(computedStyle.marginLeft, 10) || 0;
        this._props.gutter += parseInt(computedStyle.marginRight, 10) || 0;
        this._props.gutter += parseInt(computedStyle.paddingLeft, 10) || 0;
        this._props.gutter += parseInt(computedStyle.paddingRight, 10) || 0;

        for (; i < itemLength; i += 1) {
            itemWidth = parseInt(elItems[i].getAttribute(this._settings.dataWidth), 10);
            itemHeight = parseInt(elItems[i].getAttribute(this._settings.dataHeight), 10);

            // Ignore items with no or invalid data attribute values
            if (!isNaN(itemWidth) && !isNaN(itemHeight)) {
                this.items.push({
                    width: itemWidth,
                    normWidth: itemWidth * (this._settings.rowHeight / itemHeight),
                    height: itemHeight,
                    el: elItems[i].querySelector(this._settings.objSelector),
                });
            }
        }
    },

    /**
     * Make/update grid. This is where the "magic" happens
     *
     * @return {Object} instance
     */
    update: function update() {
        const gridWidth = this.el.clientWidth;
        const itemLength = this.items.length;
        const rowHeightArray = [];
        let rowFirstItem = 0;
        let rowWidth = 0;
        let rowMaxWidth = 0;
        let rowGutterWidth = 0;
        let rowHeight = 0;
        let rowHeightTotal = 0;
        let rowRatio = 0;
        let itemWidth = 0;
        let itemIsLast = false;
        let i = 0;
        let x = 0;

        for (; i < itemLength; i += 1) {
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
                        heights: rowHeightArray,
                    });
                    rowRatio = rowHeight / this._settings.rowHeight;
                } else {
                    rowRatio = Math.min(rowMaxWidth / rowWidth, 1);
                    rowHeight = Math.floor(rowRatio * this._settings.rowHeight);
                }

                rowHeightArray.push(rowHeight);
                rowHeightTotal += rowHeight;

                for (x = rowFirstItem; x <= i; x += 1) {
                    // We need to substract `1` to prevent some resize issues in Firefox and
                    // Safari. Need to find a better way to solve this...
                    itemWidth = Math.floor(rowRatio * this.items[x].normWidth) - 1;

                    this.items[x].el.style.width = `${itemWidth}px`;
                    this.items[x].el.style.height = `${rowHeight}px`;
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
     * @return  {Void}
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
     * @param   {Object} e Resize Event
     * @return  {Void}
     */
    _handleResize: function handleResize() {
        // Throttle resize event
        if (!this._props.pendingResize) {
            this._props.pendingResize = true;
            window.requestAnimationFrame(this.update.bind(this));
        }
    },

    /**
     * Destroy fluid grid instance
     *
     * @return {Void}
     */
    destroy: function destroy() {
        window.removeEventListener('resize', this._bind.resize);

        this.el = this.items = this._bind = this._settings = this._handlers = null;
    },
};

export default FldGrd;
