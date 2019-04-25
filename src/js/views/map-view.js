/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {createTooltip} from "../tooltip/tooltip";
import {categoryColorMap} from "../style/categoryColors";
import {linearColorScale} from "../style/linearColors";
import {showLegend, hideLegend} from "../legend/legend";
import {computedStyle} from "../style/computed";

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
const DEFAULT_TILE_URL = '"http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"';

const PRIVATE = Symbol("map-view-data");

function mapView(container, config) {
    // Render the view of this data
    const data = getMapData(config);
    const extents = getDataExtents(data);

    const map = getOrCreateMap(container, extents);
    setTileUrl(container);

    const useLinearColors = extents.length > 2;
    const colorScale = useLinearColors ? linearColorScale(container, extents[2]) : null;
    const colorMap = useLinearColors ? d => colorScale(d.cols[2]) : categoryColorMap(container, data);
    const sizeMap = sizeMapFromExtents(extents);

    map.vectorSource.clear();
    map.vectorSource.addFeatures(data.map(point => featureFromPoint(point, colorMap, sizeMap)));

    // Update the tooltip component
    map.tooltip.config(config).data(data);

    if (useLinearColors) {
        showLegend(container, colorScale, extents[2]);
    } else {
        hideLegend(container);
    }
}

mapView.resize = container => {
    if (container[PRIVATE]) {
        container[PRIVATE].map.updateSize();
    }
};

function featureFromPoint(point, colorMap, sizeMap) {
    const feature = new Feature(new Point(fromLonLat(point.cols)));

    const rgbColors = colorMap(point);
    if (rgbColors) {
        const rgb = rgbColors.join(",");
        const style = new CircleStyle({
            stroke: new Stroke({color: `rgb(${rgb})`}),
            fill: new Fill({color: `rgba(${rgb}, 0.5)`}),
            radius: sizeMap(point)
        });
        feature.setStyle(new Style({image: style}));
    }
    return feature;
}

function sizeMapFromExtents(extents) {
    if (extents.length > 3) {
        // We have the size value
        const range = extents[3].max - extents[3].min;
        return point => ((point.cols[3] - extents[3].min) / range) * (MAX_SIZE - MIN_SIZE) + MIN_SIZE;
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

        const tileLayer = new TileLayer();
        const vectorSource = new VectorSource({
            features: [],
            wrapX: false
        });
        const vectorLayer = new VectorLayer({source: vectorSource});

        const map = new Map({
            target: container,
            layers: [tileLayer, vectorLayer],
            view: new View({center, resolution})
        });

        const tooltip = createTooltip(container, map, vectorSource);
        container[PRIVATE] = {map, vectorSource, tooltip, tileLayer, vectorLayer};
    }

    return container[PRIVATE];
}

function setTileUrl(container) {
    const tileUrl = computedStyle(container)("--map-tile-url", DEFAULT_TILE_URL);
    const url = tileUrl.substring(1, tileUrl.length - 1);

    if (container[PRIVATE].tileUrl != url) {
        container[PRIVATE].tileLayer.setSource(new OSM({wrapX: false, url}));
        container[PRIVATE].tileUrl = url;
    }
}

mapView.plugin = {
    type: "map_view",
    name: "Map",
    max_size: 25000,
    initial: {
        type: "number",
        count: 2,
        names: ["Longitude", "Latitude", "Color", "Size"]
    }
};
export default mapView;
