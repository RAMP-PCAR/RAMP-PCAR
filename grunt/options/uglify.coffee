module.exports = 
    options:
        compress:
            drop_console: true
        report: 'min'
        sourceMap: false
        sourceMapIncludeSources: false
        preserveComments: false

    jsCore:
        options:
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy HH:MM:ss") %> : v. <%= pkg.version %> \n * \n * <%= pkg.description %> \n **/\n'

        expand: true
        cwd: 'build/js/RAMP/'
        src: '**/*.js'
        dest: 'dist/js/RAMP/'

    jsLib:
        src: 'build/js/lib/lib.js'
        dest: 'dist/js/lib/lib.min.js'

    jsPlugins:
        options:
                banner: '/*! <%= pkg.name %> Plugins <%= grunt.template.today("dd-mm-yyyy HH:MM:ss") %> : v. <%= pkg.version %> \n * \n * <%= pkg.description %> \n **/\n'

        expand: true
        cwd: 'build/js/plugins/'
        src: '**/*.js'
        dest: 'dist/js/plugins/'