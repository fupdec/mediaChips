module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  pluginOptions: {
    electronBuilder: {
      chainWebpackRendererProcess: config => {
        config.plugin('define').tap(args => {
          args[0]['process.env.FLUENTFFMPEG_COV'] = false
          return args
        })
      },
      externals: ['archiver'],
      builderOptions: {
        win: {
          icon: './icon.ico'
        }
      },
    }
  },
  devServer: {
    // hot: false,
    liveReload: false
  }
  // configureWebpack: {
  //   watchOptions: {
  //     ignored: /public/
  //   }
  // }
  // module: {
  //   rules: [
  //     {
  //       test: /\.vue$/,
  //       loader: 'vue-loader',
  //       options: {
  //         hotReload: false
  //       }
  //     }
  //   ]
  // }
}