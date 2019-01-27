const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const devMode =  false; // process.env.NODE_ENV !== 'production';

const PORT = 3000;
const PUBLIC_PATH = devMode ? `http://localhost:${PORT}/` : '/';

const htmlPlugin = new HtmlWebPackPlugin({
  template: './src/index.html',
  filename: './index.html'
});

const miniCssExtractPlugin = new MiniCssExtractPlugin({
  filename: devMode ? '[name].css' : './css/[name].[hash].css',
  chunkFilename: devMode ? '[id].css' : './css/[id].[hash].css',
});

module.exports = {
  entry: {
    app: ['./src/js/game.js'],
  },
  output: {
    filename: './js/[chunkhash].bundle.js',
    path: path.resolve(__dirname, './public'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          /node_modules/,
        ],
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
          }
        ],
      },
      {
        test: /\.(jpg|png|gif|svg|ico|webp)$/,
        include: [path.resolve(__dirname)],
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: './img/',
              publicPath: PUBLIC_PATH,
            }
          }
        ]
      }, {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: './fonts/',
            publicPath: PUBLIC_PATH,
          }
        }]
      }
    ]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 6,
        },
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  plugins: [
    new CleanWebpackPlugin([path.resolve(__dirname, './public')]),
    htmlPlugin,
    miniCssExtractPlugin,
  ],
  devServer: {
    port: PORT,
    open: true,
    historyApiFallback: true,
  },
};