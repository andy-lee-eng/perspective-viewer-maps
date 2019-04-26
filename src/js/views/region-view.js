/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {getMapData, getDataExtents} from "../data/data";
import {baseMap} from "./base-map";
import {linearColorScale} from "../style/linearColors";
import {showLegend, hideLegend} from "../legend/legend";
import {lightenRgb} from "../style/computed";

const ol = window.ol;
const {Vector: VectorLayer} = ol.layer;
const {Vector: VectorSource} = ol.source;
const {KML} = ol.format;
const {Style, Fill, Stroke} = ol.style;

const regionSources = {};
window.registerMapRegions = ({name, url, key, format = new KML({extractStyles: false})}) => {
    const source = new VectorSource({url, format, wrapX: false});
    const nameFn = typeof key == "string" ? props => props[key] : key;
    regionSources[name] = {source, nameFn};
};

function regionView(container, config) {
    const data = getMapData(config);
    const extents = getDataExtents(data);
    const map = baseMap(container);

    const regionSource = config.row_pivot.length && regionSources[config.row_pivot[0]];

    if (regionSource) {
        const vectorSource = regionSource.source;
        const colorScale = linearColorScale(container, extents[0]);
        console.log(extents[0]);
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            updateWhileInteracting: true,
            style: feature => {
                const properties = feature.getProperties();
                const regionName = regionSource.nameFn(properties);
                const dataPoint = data.find(d => d.group == regionName);
                if (dataPoint) {
                    const style = colorScale(dataPoint.cols[0]);
                    feature.setProperties({data: dataPoint, style});

                    const drawStyle = properties.highlightStyle || style;
                    return new Style({fill: new Fill({color: drawStyle.fill}), stroke: new Stroke({color: drawStyle.stroke})});
                }
            }
        });
        map.map.addLayer(vectorLayer);

        vectorSource.on("change", () => {
            baseMap.initialiseView(container, vectorSource);
        });

        // Update the tooltip component
        map.tooltip
            .config(config)
            .vectorSource(vectorSource)
            .regions(true)
            .onHighlight(onHighlight)
            .data(data);

        showLegend(container, colorScale, extents[0]);
    } else {
        hideLegend(container);
    }
}

function onHighlight(feature, highlighted) {
    const featureProperties = feature.getProperties();

    const oldStyle = featureProperties.style;
    if (!oldStyle) return;

    const style = highlighted
        ? {
              stroke: lightenRgb(oldStyle.stroke, 0.25),
              fill: lightenRgb(oldStyle.stroke, 0.5)
          }
        : null;

    feature.setProperties({highlightStyle: style});
}

regionView.resize = container => {
    baseMap.resize(container);
};

regionView.plugin = {
    type: "map_regions",
    name: "Map Regions",
    max_size: 25000,
    initial: {
        type: "number",
        count: 1,
        names: ["Color"]
    }
};
export default regionView;