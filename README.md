# Perspective Viewer Plugin Template

This project is a template for creating new viewer plugins for [Perspective](https://github.com/jpmorganchase/perspective).

## Setup

  * Fork this repo.
  * Edit `package.json` and set the name to "perspective-viewer-{myplugin}" (replacing "{myplugin}" with the name of your plugin).
  * Open a console window in the project root and run:

```
  yarn
  yarn start
```

or with npm:

```
  npm install
  npm run start
```

## Creating Views

The template project comes with an example View in `/src/js/views/view-1.js`, which renders a basic table of the data.

New views should be added to the list in `/src/js/views/views.js`.

A view is a function that takes `container`, `config` and `settings` parameters:

```javascript
function myView(container, config, settings) {
  // Render view of config into container
  // Use settings object for persisting user settings
}
```

`container` is a DOM node to render the view into
`config` is a JSON object containing the current view and data:

```javascript
  {
    row_pivots,
    aggregates,
    col_pivots,
    hidden,
    schema,
    data
  }
```

`settings` is a JSON object that can be used to persist user settings. When the `perspective-viewer` `save()` method is called, the plugin's `settings` object will be serialised along with the rest of the configuration. It is restored when `perspective-viewer` `restore()` is called.

## Styling with Less and Themes

CSS styles should be added to `/src/less/plugin.less` (additional less modules can be imported into this less file).

Theming is supported via `src/themes/material.dark.less`. Variables defined here can be used in the main less file with a fallback like this:

```css
  .selection {
    color: var(--plugin-theme-variable, #ff0000);
  }
```

To apply the theme at runtime, include the theme css file:

```html
<link rel='stylesheet' href="/myplugin.plugin.dark.css" is="custom-style">
```

## Resizing

The template element in `/src/js/plugin/template.js` has a `resize()` function that gets called by `perspective-viewer` when the container is resized. If you need to re-render during a resize event, then add something here.

