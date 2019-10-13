const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MpWebpackPlugin = require('../plugin/MpWebpackPlugin');
const MpRuntimePlugin = require('../plugin/MpRuntimePlugin');

function resolve() {
  return path.resolve(__dirname, ...arguments);
}

const debuggable = process.env.BUILD_TYPE !== 'release';
const srcDir = resolve('../src');

const relativeFileLoader = (ext = '[ext]', context = srcDir) => {
  return {
    loader: 'file-loader',
    options: {
      useRelativePath: true,
      name: `[path][name].${ext}`,
      context: context,
    },
  };
};

module.exports = {
  context: srcDir,
  entry: './app.js',
  output: {
    path: resolve('../dist'),
    filename: '[name].js',
    globalObject: 'wx'
  },
  module: {
    rules: [
      {
        test:/\.(jpg|png|gif|bmp|jpeg)$/,
        use:[
          {
            loader:'url-loader',
            options:{ // 这里的options选项参数可以定义多大的图片转换为base64
              limit:50000, // 表示小于50kb的图片转为base64,大于50kb的是路径
              name:'[name].[ext]', //定义输出的图片文件夹
              context: srcDir,
              outputPath: 'images'
            }
          },
        ]
      },
      {
         test: /\.js$/,
         use: 'babel-loader',
         include: /src/, //指定打包的文件
         exclude: resolve('../node_modules') //排除打包的文件，加速打包时间
      },
      {
        test: /\.(scss|wxss)$/,
        include: /src/,
        use: [
          relativeFileLoader('wxss'),
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                indentWidth: 2, //缩进宽度
                outputStyle: 'expanded', //嵌套输出方式 nested  展开输出方式 expanded   紧凑输出方式 compact  压缩输出方式 compressed
                includePaths: [srcDir],
              },
            },
          },
        ],
      },
      {
        test: /\.wxml$/,
        // include: /src/,
        use: [
          relativeFileLoader('wxml'),
          {
            loader: 'wxml-loader',
            options: {
              root: srcDir,
              enforceRelativePath: true
            },
          },
        ]
      },
    ]
  },
  resolve: {
    //配置别名，在项目中可缩减引用路径
    alias: {
      '@': resolve('../src'),
      '@img': resolve('../src/images')
    }
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyWebpackPlugin([
      {
        context: resolve("../src"),
        from: '**/*',
        to: './',
        ignore: ['**/*.js', '**/*.scss', '**/*.wxml', '**/*.jpg', '**/*.png', '**/*.gif', '**/*.bmp', '**/*.jpeg'],
      },
    ]),
    new MpWebpackPlugin({
      scriptExtensions: ['.js'],
      assetExtensions: ['.scss'],
    }),
    new MpRuntimePlugin(),
    new webpack.EnvironmentPlugin({
       NODE_ENV: JSON.stringify(process.env.NODE_ENV) || 'development',
       BUILD_TYPE: JSON.stringify(process.env.BUILD_TYPE) || 'debug',
    }),
  ].filter(Boolean),
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: 'common',
      minChunks: 2,
      minSize: 0,
    },
    runtimeChunk: {
      name: 'runtime'
    }
  },
  mode: debuggable ? 'development' : 'production',
  devtool: debuggable ? 'inline-source-map' : 'source-map',
}
