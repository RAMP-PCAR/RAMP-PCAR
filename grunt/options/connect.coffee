module.exports = 
    #options:
        #port: 3002

    build:
        options:
            base: 'build'
            port: '<%= pkg.serve.port %>'
            livereload: '<%= pkg.serve.livereload %>'

    dist:
        options:
            base: 'dist'
            port: '<%= pkg.serve.port %>'
            keepalive: true