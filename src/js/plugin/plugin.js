/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import views from "../views/views";
import "./template";
import {name} from "../../../package.json";

export const PRIVATE = Symbol(name);

const DEFAULT_PLUGIN_SETTINGS = {
    initial: {
        type: "number",
        count: 1
    },
    selectMode: "select"
};

views.forEach(view => {
    global.registerPlugin(view.plugin.type, {
        ...DEFAULT_PLUGIN_SETTINGS,
        ...view.plugin,
        create: drawView(view),
        resize: resizeView,
        delete: deleteView,
        save,
        restore
    });
});

function drawView(viewEntryPoint) {
    return async function(el, view, task) {
        const [tschema, schema, data, config] = await Promise.all([this._table.schema(), view.schema(), view.to_json(), view.get_config()]);
        if (task.cancelled) {
            return;
        }

        getElement.call(this, el).render(viewEntryPoint, Object.assign({schema, tschema, data}, config));
    };
}

function resizeView() {
    if (this[PRIVATE] && this[PRIVATE].view) {
        this[PRIVATE].view.resize();
    }
}

function deleteView() {
    if (this[PRIVATE] && this[PRIVATE].view) {
        this[PRIVATE].view.remove();
    }
}

function save() {
    if (this[PRIVATE] && this[PRIVATE].chart) {
        const perspective_d3fc_element = this[PRIVATE].chart;
        return perspective_d3fc_element.getSettings();
    }
}

function restore(settings) {
    const perspective_d3fc_element = getOrCreatePlugin.call(this);
    perspective_d3fc_element.setSettings(settings);
}

function getOrCreatePlugin() {
    this[PRIVATE] = this[PRIVATE] || {};
    if (!this[PRIVATE].view) {
        this[PRIVATE].view = document.createElement(name);
    }

    return this[PRIVATE].view;
}

function getElement(div) {
    const perspective_d3fc_element = getOrCreatePlugin.call(this);

    if (!document.body.contains(perspective_d3fc_element)) {
        div.innerHTML = "";
        div.appendChild(perspective_d3fc_element);
    }

    return perspective_d3fc_element;
}
