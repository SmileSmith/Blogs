const path = require('path');

module.exports = {
    entry: './index.js',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        modules: false,
                                    },
                                ],
                            ],
                            plugins: ['@babel/plugin-transform-runtime'],
                            sourceType: "unambiguous"
                        },
                    },
                ],
            },
        ],
    },
    devtool:'source-map',
    // mode: 'development',
};
