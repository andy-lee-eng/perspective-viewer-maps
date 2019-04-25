# Perspective Viewer Plugin Template

A mapp view plugin for [Perspective](https://github.com/jpmorganchase/perspective)

## Setup

```
  yarn
  yarn start
```

or with npm:

```
  npm install
  npm run start
```

## About the plugin

It uses [OpenLayers](https://openlayers.org/) and [OpenStreetMap](https://www.openstreetmap.org/#map=13/51.1366/-3.6823) to display data as a map view.

This project was built as an example for the blog article [Perspective Plugin API - How to build a new plugin](https://blog.scottlogic.com/2019/04/23/perspective-plugin-api-how-to-build-a-new-plugin.html);

## Themes

Perspective viewer itself, and the map plugin can be themed.

The plugin includes a dark-theme file `maps.plugin.dark.css`, with some default theme variables. Alternatively, you can override specific theme variables using a style block:

```
  <style>
    perspective-viewer {

      // Change the first 2 categories to red and green
      --map-category-1: #ff0000;
      --map-category-2: #00ff00;

      // Change the color gradient to blue-grey-red
      --map-gradient: linear-gradient(#0000ff 0%, #a0a0a0 50%, #ff0000 100%);

      // Change the source url for the map tiles
      --map-tile-url: "http://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
    }
  </style>
```
