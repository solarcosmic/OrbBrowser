const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: "development",
    target: "electron-preload",
    entry: {
        preload: "./preload.cjs",
        renderer: "./src/script.js",
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: require.resolve("./node_modules/electron-chrome-extensions/dist/chrome-extension-api.preload.js"), to: "preload.cjs" }
            ]
        })
    ],
    resolve: {
        extensions: [".js"],
        alias: {
            framework: path.resolve(__dirname, "src/framework/")
        }
    },
};