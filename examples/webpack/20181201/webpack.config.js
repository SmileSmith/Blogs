const path = require('path');
const UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;

module.exports = {
    entry: {
        app: "./index.js"
    },
    output: {
        path: path.resolve('./dist'),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".js"],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        // remove {{ modules: false }} or {{ plugins: ["transform-runtime"] }} ,it work correct
                        options: {
                            presets: [
                                [
                                    "env",
                                    {
                                        modules: false
                                    }
                                ],
                                "stage-2",
                            ],
                            plugins: ["transform-runtime"],
                            cacheDirectory: true
                        }
                    }
                ],
            }
        ]
    },
    plugins: [
        // new UglifyJsPlugin({sourceMap:true, compress: {warnings: false}})
    ],
    devtool:'cheap-source-map',
    node:false,
};
