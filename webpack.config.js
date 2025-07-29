const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  
  // Entry points
  entry: {
    taskpane: './src/taskpane/index.tsx',
    commands: './src/commands/commands.ts'
  },
  
  // Development configuration
  devtool: isProduction ? 'source-map' : 'inline-source-map',
  
  // Development server configuration
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    hot: true,
    https: true, // Required for Office Add-ins
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
  
  // Module resolution
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@templates': path.resolve(__dirname, 'src/templates'),
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  },
  
  // Module rules
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: !isProduction, // Faster builds in development
              configFile: 'tsconfig.json'
            }
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      },
    ],
  },
  
  // Output configuration
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/',
  },
  
  // Plugins
  plugins: [
    // Task pane HTML
    new HtmlWebpackPlugin({
      template: 'src/taskpane/taskpane.html',
      filename: 'taskpane.html',
      chunks: ['taskpane'],
      inject: 'body',
      minify: isProduction ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false
    }),
    
    // Commands HTML
    new HtmlWebpackPlugin({
      template: 'src/commands/commands.html',
      filename: 'commands.html',
      chunks: ['commands'],
      inject: 'body',
      minify: isProduction ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false
    })
  ],
  
  // Optimization - Enhanced for performance
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000, // 244KB chunks for optimal loading
      cacheGroups: {
        // React framework bundle
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30,
          reuseExistingChunk: true,
        },
        
        // Office and Fluent UI bundle
        office: {
          test: /[\\/]node_modules[\\/](@fluentui|office-js)[\\/]/,
          name: 'office-ui',
          chunks: 'all',
          priority: 25,
          reuseExistingChunk: true,
        },
        
        // Utility libraries bundle
        utilities: {
          test: /[\\/]node_modules[\\/](zod|date-fns|lodash)[\\/]/,
          name: 'utilities',
          chunks: 'all',
          priority: 20,
          reuseExistingChunk: true,
        },
        
        // Vendor bundle for remaining dependencies
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
        },
        
        // Common code shared between chunks
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
    
    runtimeChunk: 'single',
    minimize: isProduction,
    
    // Module concatenation for better tree shaking
    concatenateModules: true,
    
    // Mark unused exports for tree shaking
    usedExports: true,
    
    // Enable side effects detection
    sideEffects: false,
    
    // Minimizer configuration
    minimizer: isProduction ? [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.warn'],
            passes: 2,
          },
          mangle: {
            safari10: true,
          },
          output: {
            comments: false,
            ascii_only: true,
          },
        },
        extractComments: false,
        parallel: true,
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ] : [],
  },
  
  // Performance hints - Enhanced budgets
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 400000, // 400KB for initial load
    maxAssetSize: 244000, // 244KB per chunk
    assetFilter: (assetFilename) => {
      // Only check JS and CSS files
      return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    },
  },
  
  // Stats configuration
  stats: {
    errorDetails: true,
    children: false,
    modules: false,
  },
  
  // Cache configuration for faster builds
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
};