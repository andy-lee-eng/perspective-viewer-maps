/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {createTooltip} from "../tooltip/tooltip";

const ol = window.ol;
const {Map, View, Feature} = ol;
const {Tile: TileLayer, Vector: VectorLayer} = ol.layer;
const {OSM, Vector: VectorSource} = ol.source;
const {fromLonLat} = ol.proj;
const {Point} = ol.geom;
const {Circle: CircleStyle, Style, Fill, Stroke} = ol.style;

const MIN_SIZE = 2;
const MAX_SIZE = 20;
const DEFAULT_SIZE = 5;

const PRIVATE = Symbol("map-view-data");

const CATEGORY_COLORS = ["1f77b4", "0366d6", "ff7f0e", "2ca02c", "d62728", "9467bd", "8c564b", "e377c2", "7f7f7f", "bcbd22", "17becf"];

function mapView(container, config) {
    // Render the view of this data
    const data = getMapData(config);
    const extents = getDataExtents(data);

    const map = getOrCreateMap(container, extents);
    const colorMap = colorMapFromCategories(data);
    const sizeMap = sizeMapFromExtents(extents);

    map.vectorSource.clear();
    map.vectorSource.addFeatures(data.map(point => featureFromPoint(point, colorMap, sizeMap)));

    // Update the tooltip component
    map.tooltip.config(config).data(data);
}

mapView.resize = container => {
    if (container[PRIVATE]) {
        container[PRIVATE].map.updateSize();
    }
};

function featureFromPoint(point, colorMap, sizeMap) {
    const feature = new Feature(new Point(fromLonLat(point.cols)));

    const rgb = colorMap(point).join(",");
    const style = new CircleStyle({
        stroke: new Stroke({color: `rgb(${rgb})`}),
        fill: new Fill({color: `rgba(${rgb}, 0.5)`}),
        radius: sizeMap(point)
    });
    feature.setStyle(new Style({image: style}));
    return feature;
}

function colorMapFromCategories(data) {
    let colIndex = 0;
    const categories = {};

    data.forEach(point => {
        if (!categories[point.category]) {
            const col = CATEGORY_COLORS[colIndex];
            categories[point.category] = [col.substring(0, 2), col.substring(2, 4), col.substring(4, 6)].map(c => parseInt(c, 16));

            colIndex++;
            if (colIndex >= CATEGORY_COLORS.length) colIndex = 0;
        }
    });

    return point => categories[point.category];
}

function sizeMapFromExtents(extents) {
    if (extents.length > 2) {
        // We have the size value
        const range = extents[2].max - extents[2].min;
        return point => ((point.cols[2] - extents[2].min) / range) * (MAX_SIZE - MIN_SIZE) + MIN_SIZE;
    }
    return () => DEFAULT_SIZE;
}

function getMapData(config) {
    const points = [];

    // Enumerate through supplied data
    config.data.forEach((row, i) => {
        // Exclude "total" rows that don't have all values
        const groupCount = row.__ROW_PATH__ ? row.__ROW_PATH__.length : 0;
        if (groupCount < config.row_pivot.length) return;

        // Get the group from the row path
        const group = row.__ROW_PATH__ ? row.__ROW_PATH__.join("|") : `${i}`;
        const rowPoints = {};

        // Split the rest of the row into a point for each category
        Object.keys(row)
            .filter(key => key !== "__ROW_PATH__" && row[key] !== null)
            .forEach(key => {
                const split = key.split("|");
                const category = split.length > 1 ? split.slice(0, split.length - 1).join("|") : "__default__";
                rowPoints[category] = rowPoints[category] || {group, row};
                rowPoints[category][split[split.length - 1]] = row[key];
            });

        // Add the points for this row to the data set
        Object.keys(rowPoints).forEach(key => {
            const rowPoint = rowPoints[key];
            const cols = config.aggregate.map(a => rowPoint[a.column]);
            points.push({
                cols,
                group: rowPoint.group,
                row: rowPoint.row,
                category: key
            });
        });
    });

    return points;
}

function getDataExtents(data) {
    let extents = null;
    data.forEach(point => {
        if (!extents) {
            extents = point.cols.map(c => ({min: c, max: c}));
        } else {
            extents = point.cols.map((c, i) => (c ? {min: Math.min(c, extents[i].min), max: Math.max(c, extents[i].max)} : extents[i]));
        }
    });
    return extents;
}

function getOrCreateMap(container, extents) {
    if (!container[PRIVATE]) {
        const size = container.getBoundingClientRect();
        const pExtents = [fromLonLat([extents[0].min, extents[1].min]), fromLonLat([extents[0].max, extents[1].max])];
        const center = [(pExtents[0][0] + pExtents[1][0]) / 2, (pExtents[0][1] + pExtents[1][1]) / 2];
        const resolution = Math.max(Math.abs(pExtents[1][0] - pExtents[0][0]) / size.width, Math.abs(pExtents[1][1] - pExtents[0][1]) / size.height);

        const vectorSource = new VectorSource({
            features: [],
            wrapX: false
        });
        const map = new Map({
            target: container,
            layers: [new TileLayer({source: new OSM({wrapX: false})}), new VectorLayer({source: vectorSource})],
            view: new View({center, resolution})
        });
        const tooltip = createTooltip(container, map, vectorSource);
        container[PRIVATE] = {map, vectorSource, tooltip};
    }

    return container[PRIVATE];
}

mapView.plugin = {
    type: "map_view",
    name: "Map",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2,
        names: ["Longitude", "Latitude", "Size"]
    }
};
export default mapView;
