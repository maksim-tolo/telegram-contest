const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const paths = require('./paths');

const publicPath = '/';

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: [paths.appIndexJs],
  output: {
    pathinfo: true,
    filename: 'static/js/bundle.js',
    chunkFilename: 'static/js/[name].chunk.js',
    publicPath,
  },
  resolve: {
    extensions: ['.web.js', '.mjs', '.js', '.json'],
  },
  module: {
    strictExportPresence: true,
    rules: [
      { parser: { requireEnsure: false } },
      {
        oneOf: [
          {
            test: /\.(js|mjs)$/,
            include: paths.appSrc,
            use: [
              /*{
                loader: require.resolve('babel-loader'),
                options: {
                  cacheDirectory: true,
                  highlightCode: true,
                },
              },*/
            ],
          },
          {
            test: /\.p?css$/,
            exclude: /\.module\.p?css$/,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                  modules: 'global',
                  import: false,
                },
              },
              // require.resolve('postcss-loader'),
            ],
          },
          {
            test: /\.module\.p?css$/,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                  modules: 'local',
                  import: false,
                  localIdentName: '[folder]_[local]_[hash:base64:4]',
                },
              },
              // require.resolve('postcss-loader'),
            ],
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml,
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
  },
  performance: {
    hints: false,
  },
  devServer: {
    compress: true,
    clientLogLevel: 'none',
    contentBase: paths.appPublic,
    watchContentBase: true,
    hot: true,
    publicPath,
  },
};
