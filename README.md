# FLD GRD
[![fluid grid demo page](/img/thumbnail.png?raw=true)](https://fld-grd.js.org/)

## Install
**Yarn**
```shell
yarn add fld-grd
```


**NPM**
```shell
npm install --save fld-grd
```

**Bower**
```shell
bower install --save fld-grd
```

## Usage
### HTML
`Fld Grd` works with one container element and a set of child elements. You can use whatever class names you want, and it's also possible to change the data attribute names.

```html
<div class="fld-grd">
    <div data-fld-width="300" data-fld-height="200">
        <img src="300x200.jpg" width="300">
    </div>
    <div data-fld-width="600" data-fld-height="250">
        <img src="600x250.jpg" width="600">
    </div>
    <div data-fld-width="100" data-fld-height="300">
        <img src="100x300.jpg" width="100">
    </div>
</div>
```

### CSS
To show all fluid grid items in a row, you can use `float`, `display: inline-block` or `flexbox`.
Grid gutters with `margin` or `padding` are also supported.

```css
/**
 * 1. Optional: 10px gutter
 */
.fld-grd {
    margin-right: -5px; /* [1] */
    margin-left: -5px; /* [1] */
}

/**
 * 1. Mandatory: `display: inline-block` or a flexbox based grid system do also work
 * 2. Optional: 10px gutter
 */
.fld-grd > div {
    float: left; /* [1] */
    padding-right: 5px; /* [2] */
    padding-left: 5px; /* [2] */
}

/**
 * 1. Optional: Setting `vertical-align` removes the whitespace that appears below `<img>` elements
 *    when they are dropped into a page as-is
 */
.fld-grd > div > img {
    vertical-align: top; /* [1] */
}
```

### JavaScript
```javascript
var fldGrd = new FldGrd(document.querySelector('.fld-grd'), {
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
     * @param  {Array}    rows.heights
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
});

// Manually update fluid grid
fldGrd.update();

// Destroy `fldGrd` instance
fldGrd.destroy();
```

## Browser Support
All major browsers are supported (IE9+). If you need to support IE9, you'll have to [polyfill `requestAnimationFrame`](https://gist.github.com/paulirish/1579671).

## Local Development
To compile and compress `fldGrd.js`, we rely on [npm](https://www.npmjs.com/) as a Build Tool.

### Setup
1. Check out the repository

    ```shell
    git clone git@github.com:mrksbnch/fld-grd.git
    cd fld-grd
    ```

2. Run `npm install` to install all dependencies

### Workflow

| NPM command                   | Description                                                      |
| ----------------------------- | ---------------------------------------------------------------- |
| `npm run lint`                | (es)lint JavaScript                                              |
| `npm run uglify`              | Compress JavaScript                                              |
| `npm run babel`               | Compile ES6 to ES5 with Babel                                    |
| `npm run build`               | Lint, compress and minify JavaScript                             |
| `npm run watch`               | Watch file changes                                               |

## Copyright
Copyright 2016 Markus Bianchi. See [LICENSE](https://github.com/mrksbnch/fld-grd/blob/master/LICENSE.md) for details.
