/*------------------------------------*\
    #FLD-GRD 0.1.0
\*------------------------------------*/
/**
 * Defaults
 *
 * @type {object}
 */
const defaults = {
    /**
     * Maximum row height
     *
     * @type {integer}
     */
    rowHeight: 250,

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
    dataHeight: 'data-fld-height',
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
 * @param  {object} target
 * @return {object} output
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
* @param {element} el
* @param {object}  [options]
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
     * @return  {void}
     */
    _init: function init() {
        this._setup();
        this._attachEventListeners();
        this.make();
    },

    /**
     * Calculate gutter width and dimesions for each item
     *
     * @private
     * @return {void}
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
                el: elItems[i].querySelector(this._settings.objSelector),
            });
        }
    },

    /**
     * Make grid. This is where the "magic" happens
     *
     * @return {object} instance
     */
    make: function make() {
        const gridWidth = this.el.clientWidth;
        const itemLength = this.items.length;
        let rowIsLast = false;
        let rowFirstItem = 0;
        let rowWidth = 0;
        let rowMaxWidth = 0;
        let rowGutterWidth = 0;
        let rowHeight = 0;
        let rowRatio = 0;
        let itemWidth = 0;
        let i = 0;
        let x = 0;

        for (; i < itemLength; i++) {
            rowWidth += this.items[i].normWidth;
            rowGutterWidth += this._props.gutter;
            rowIsLast = i === itemLength - 1;

            if (rowWidth + rowGutterWidth >= gridWidth || rowIsLast) {
                // Since gutters always have the same width (regardless of `rowHeight`), we need
                // to exclude them from the calculations
                rowMaxWidth = gridWidth - rowGutterWidth;
                rowRatio = Math.min(rowMaxWidth / rowWidth, 1);
                rowHeight = Math.floor(rowRatio * this._settings.rowHeight);

                for (x = rowFirstItem; x <= i; x++) {
                    // We need to substract 1 to prevent some resize issues in Firefox and
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
    },

    /**
     * Attach event listeners
     *
     * @return  {void}
     * @private
     */
    _attachEventListeners: function addEventListener() {
        this._bind.resize = this._onResize.bind(this);

        window.addEventListener('resize', this._bind.resize);
    },

    /**
     * Fired when browser window is resized
     *
     * @private
     * @param   {object} e
     * @return  {void}
     */
    _onResize: function onRsize() {
        // Throttle resize
        if (!this._props.pendingResize) {
            this._props.pendingResize = true;
            window.requestAnimationFrame(this.make.bind(this));
        }
    },

    /**
     * Destroy fluid grid instance
     *
     * @return {object} instance
     */
    destroy: function destroy() {
        window.removeEventListener('resize', this._bind.resize);

        this.el = this.items = this._bind = this._settings = this._handlers = null;

        return this;
    },
};

export default FldGrd;
