module.exports = {
  apps : [{
    name: 'Visor-Covid',
    exec_mode: 'cluster', //'fork',
//    instances: 'max', // Or a number of instances
    instances: 1,
    script: './node_modules/nuxt/bin/nuxt.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: 'start',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],
  /*
  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
  */
};

/*
  pm2 startup        // Crea deamons
  pm2 start (1)      // Ejecutar aplicaciones 
  pm2 start (2)
  pm2 start (etc)
  pm2 save           // Guarda deamons y queda listo para el startup en Linux
*/