// eslint-disable-next-line import/no-commonjs
const { join } = require('path');

const config = {
  projectName: 'taro-list',
  date: '2019-12-30',
  designWidth: 750,
  deviceRatio: {
    '640': 2.34 / 2,
    '750': 1,
    '828': 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',

  plugins: {
    babel: {
      sourceMap: true,
      presets: [
        [
          'env',
          {
            modules: false
          }
        ]
      ],
      plugins: [
        'transform-decorators-legacy',
        'transform-class-properties',
        'transform-object-rest-spread'
      ]
    },
    uglify: {
      enable: true,
      config: {
        // 配置项同 https://github.com/mishoo/UglifyJS2#minify-options
      }
    },
    csso: {
      enable: true,
      config: {
        // 配置项同 https://github.com/css/csso#minifysource-options
      }
    }
  },
  alias: {
    '@': join(__dirname, '..', 'src')
  },
  defineConstants: {},
  copy: {
    patterns: [
      {
        from: 'src/components/List/refresh.wxs',
        to: 'dist/components/List/refresh.wxs'
      },
      {
        from: 'src/components/List/index.template.wxml',
        to: 'dist/components/List/index.template.wxml'
      },

    ],
    options: {}
  },
  weapp: {
    module: {
      postcss: {
        autoprefixer: {
          enable: true,
          config: {
            browsers: ['last 1 versions']
          }
        },
        pxtransform: {
          enable: true,
          config: {}
        },
        url: {
          enable: true,
          config: {
            limit: 1024 * 8 // 设定转换尺寸上限
          }
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'assets',
    webpack: {
      alisa: {}
    },
    module: {
      postcss: {
        autoprefixer: {
          enable: true,
          config: {
            browsers: ['last 3 versions', 'Android >= 4.1', 'ios >= 8']
          }
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    }
  }
};

if (process.env.TARO_BUILD_TYPE === 'ui') {
  Object.assign(config.h5, {
    enableSourceMap: false,
    enableExtract: false,
    enableDll: false
  });
  config.h5.webpackChain = chain => {
    chain.plugins.delete('htmlWebpackPlugin');
    chain.plugins.delete('addAssetHtmlWebpackPlugin');
    chain.merge({
      output: {
        path: path.join(process.cwd(), 'dist', 'h5'),
        filename: 'index.js',
        libraryTarget: 'umd',
        library: 'taro-ui-sample'
      },
      externals: {
        nervjs: 'commonjs2 nervjs',
        classnames: 'commonjs2 classnames',
        '@tarojs/components': 'commonjs2 @tarojs/components',
        '@tarojs/taro-h5': 'commonjs2 @tarojs/taro-h5',
        weui: 'commonjs2 weui'
      }
    });
  };
}

module.exports = function(merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }
  return merge({}, config, require('./prod'));
};
