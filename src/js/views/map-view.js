/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const ol = window.ol;
const {Map, View, Feature} = ol;
const {Tile: TileLayer, Vector: VectorLayer} = ol.layer;
const {OSM, Vector: VectorSource} = ol.source;
const {fromLonLat} = ol.proj;
const {Circle} = ol.geom;
const {Style, Fill, Stroke} = ol.style;

const MIN_RATIO = 0.002;
const MAX_RATIO = 0.02;
const DEFAULT_RATIO = 0.005;

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
}

function featureFromPoint(point, colorMap, sizeMap) {
    const feature = new Feature(new Circle(fromLonLat(point.cols), sizeMap(point)));

    const color = colorMap(point).join(",");
    feature.setStyle(
        new Style({
            stroke: new Stroke({color: `rgb(${color})`}),
            fill: new Fill({color: `rgba(${color}, 0.5)`})
        })
    );
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
    const pExtents = [fromLonLat([extents[0].min, extents[1].min]), fromLonLat([extents[0].max, extents[1].max])];
    const mapSize = Math.min(pExtents[1][0] - pExtents[0][0], pExtents[1][1] - pExtents[0][1]);
    if (extents.length > 2) {
        const max_size = MAX_RATIO * mapSize;
        const min_size = MIN_RATIO * mapSize;

        // We have the size value
        const range = extents[2].max - extents[2].min;
        return point => ((point.cols[2] - extents[2].min) / range) * (max_size - min_size) + min_size;
    }
    return () => DEFAULT_RATIO * mapSize;
}

function getMapData(config) {
    const points = [];

    // Enumerate through supplied data
    config.data.forEach((row, i) => {
        // Exclude "total" rows that don't have all values
        const groupCount = row.__ROW_PATH__ ? row.__ROW_PATH__.length : 0;
        if (groupCount < config.row_pivot.length) return;

        // Get the group from the row path
        const group = row.__ROW_PATH__ ? row.__ROW_PATH__.join(",") : `${i}`;
        const rowPoints = {};

        // Split the rest of the row into a point for each category
        Object.keys(row)
            .filter(key => key !== "__ROW_PATH__" && row[key] !== null)
            .forEach(key => {
                const split = key.split("|");
                const category = split.length > 1 ? split.slice(0, split.length - 1).join(",") : "__default__";
                rowPoints[category] = rowPoints[category] || {group};
                rowPoints[category][split[split.length - 1]] = row[key];
            });

        // Add the points for this row to the data set
        Object.keys(rowPoints).forEach(key => {
            const rowPoint = rowPoints[key];
            const cols = config.aggregate.map(a => rowPoint[a.column]);
            points.push({
                cols,
                group: rowPoint.group,
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
            features: []
        });
        const map = new Map({
            target: container,
            layers: [new TileLayer({source: new OSM()}), new VectorLayer({source: vectorSource})],
            view: new View({center, resolution})
        });
        container[PRIVATE] = {map, vectorSource};
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
