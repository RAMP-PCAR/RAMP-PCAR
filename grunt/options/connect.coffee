module.exports = 
    #options:
        #port: 3002

    build:
        options:
            base: 'build'
            port: 3002
            livereload: true

    dist:
        options:
            base: 'dist'
            port: 3002
            keepalive: true