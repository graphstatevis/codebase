import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { Configuration as WebpackConfiguration, ProvidePlugin } from 'webpack';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const configuration: Configuration = {
  devServer: {
    contentBase: './public',
    hot: true,
    watchContentBase: true
  },

  entry: {
    app: './src/Layout/Layout.ts',
  },

  node: {
    fs: 'empty'
  },

  mode: 'development',

  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: [
          {
            loader: 'awesome-typescript-loader'
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader', options: { injectType: 'singletonStyleTag' } },
          { loader: 'css-loader' }
        ]
      },
      {
        test: /\.(eot|jpe?g|pdf|png|svg|ttf|woff2?)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false, // Needed to be able to `require()` images in `.html` files.
              name: '[path][name].[ext]'
            }
          }
        ]
      },
      {
        exclude: /\index\.html$/,
        test: /\.html$/,
        use: 'html-loader'
      },
      {
        test: /\.xml$/,
        use: 'raw-loader'
      }
    ]
  },

  output: {
    filename: '[name].js',
    globalObject: 'this',
    path: path.resolve(__dirname, 'build'),
    publicPath: '/'
  },

  plugins: [
    new ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      'global.jQuery': 'jquery'
    }),
    new HtmlWebpackPlugin({
      chunks: ['app'],
      favicon: 'public/favicon.ico',
      filename: 'index.html',
      inject: 'head',
      template: 'public/index.html'
    })
  ],

  resolve: {
    extensions: ['.js', '.ts'],    
    alias: {
      'jquery-ui': 'jquery-ui-dist/jquery-ui.js'
    }
  }
};

export default configuration;
