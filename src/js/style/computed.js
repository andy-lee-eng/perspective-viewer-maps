/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
import {color} from "d3-color";

export const computedStyle = container => {
    if (window.ShadyCSS) {
        return (name, defaultValue) => window.ShadyCSS.getComputedStyleValue(container, name) || defaultValue;
    } else {
        const containerStyles = getComputedStyle(container);
        return (name, defaultValue) => containerStyles.getPropertyValue(name) || defaultValue;
    }
};

export const asRgb = col => {
    const asColor = color(col);
    return [asColor.r, asColor.g, asColor.b];
};
