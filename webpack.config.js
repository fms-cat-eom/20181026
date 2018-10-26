/* eslint-env node */

const path = require( 'path' );

const HtmlWebpackPlugin = require( 'html-webpack-plugin' );

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: path.resolve( __dirname, 'src/main.js' ),
  output: {
    path: path.resolve( __dirname, 'dist' ),
    filename: 'bundle.js'
  },
  devServer: {
    inline: true,
    hot: true
  },
  module: {
    rules: [
      { test: /\.(png|jpg|gif|ttf|otf)$/, use: 'url-loader' },
      { test: /\.(sass|scss|css)$/, use: [ 'style-loader', 'css-loader' ] },
      { test: /\.(sass|scss)$/, use: 'sass-loader' },
      { test: /\.(glsl|frag|vert)$/, use: [ 'raw-loader', 'scarlett-glslify-loader' ] },
      { test: /\.js$/, use: {
        loader: 'babel-loader',
        options: { presets: [ '@babel/env' ] }
      } }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin( {
      template: './src/html/index.html'
    } )
  ]
};