const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    target: "electron-preload",
    entry: "./preload.js",
    output: {
        filename: "preload.bundle.js",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: require.resolve("./node_modules/electron-chrome-extensions/dist/chrome-extension-api.preload.js"), to: "preload.js" }
            ]
        })
    ],
    resolve: {
        extensions: [".js"]
    },
};