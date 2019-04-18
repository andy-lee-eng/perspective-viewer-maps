/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const path = require("path");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const pkg = require("./package.json");
const PREFIX = "perspective-viewer-";

const library = pkg.name;
const name = library.indexOf(PREFIX) == 0 ? library.substring(PREFIX.length) : library;

module.exports = {
    entry: ["./src/js/plugin/plugin.js", "./src/themes/material.dark.less"],
    devtool: "source-map",
    mode: "development",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.less$/,
                include: [
                    path.resolve(__dirname, "src/less")
                ],
                use: [
                    { loader: 'css-loader' },
                    { loader: 'less-loader' }
                ]
            },
            {
                test: /\.less$/,
                include: [
                    path.resolve(__dirname, "src/themes")
                ],
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    { loader: 'css-loader' },
                    { loader: 'less-loader' }
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: `${name}.plugin.dark.css` })
    ],
    optimization: {
        minimizer: [
            new UglifyJSPlugin({
                uglifyOptions: { sourceMap: true, mangle: false }
            })
        ]
    },
    output: {
        filename: `${name}.plugin.js`,
        library: library,
        libraryTarget: "umd",
        path: path.join(__dirname, "build")
    },
    devServer: {
      contentBase: [
        path.join(__dirname, 'examples'),
        path.resolve(__dirname, "node_modules/@jpmorganchase/perspective/build"),
        path.resolve(__dirname, "node_modules/@jpmorganchase/perspective-viewer/build"),
        path.resolve(__dirname, "node_modules/@jpmorganchase/perspective-viewer-highcharts/build"),
        path.resolve(__dirname, "node_modules/@jpmorganchase/perspective-viewer-hypergrid/build"),
        path.resolve(__dirname, "node_modules/@jpmorganchase/perspective-viewer-d3fc/build")
      ],
      proxy: {
            "/template.plugin.js": {
                target: `http://localhost:8080/${name}.plugin.js`,
                ignorePath: true
            },
            "/template.plugin.dark.css": {
                target: `http://localhost:8080/${name}.plugin.dark.css`,
                ignorePath: true
            }
      }
    }
};
