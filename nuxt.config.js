const colors = require('vuetify/es5/util/colors').default

module.exports = {
  ssr: false,
  /*
  ** Headers of the page
  */
  head: {
    titleTemplate: '%s - ' + process.env.npm_package_name,
    title: "Reporte Epidemiológico",
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    ]
  },
  serverMiddleware: [
    '~/api/index.js'
  ],
  /*
  ** Customize the progress-bar color
  */
 loading: { color: '#fff' },
 /*
 ** Global CSS
 */
  css: [
  ],
  /* base host para todas las IP y Puerto */
  server: {
    host: '0.0.0.0',
    port: 3003
  },
/*
  ** Plugins to load before mounting the App
  */
  plugins: [
    '~/plugins/xlsx',
//    '~/plugins/vuetify',
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    '@nuxtjs/vuetify',
    '@nuxt/components',
  ],
  components: true,  
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    '@nuxtjs/pwa',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
    //baseURL: process.env.API_URL
    baseURL: "http://10.200.0.50:3003"
    //baseURL: process.env.BASE_URL
  },
  /*
  ** vuetify module configuration
  ** https://github.com/nuxt-community/vuetify-module
  */
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        }
      }
    }
  },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    //analyze: true,
    extend (config, ctx) {
    }
  }
}
