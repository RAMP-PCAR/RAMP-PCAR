module.exports = 
    options:
        livereload: '<%= pkg.serve.livereload %>'
        livereloadOnError: false

    pages:
        files: [
            'site/**/*.hbs'
        ]
        tasks: [
            #'build'
            'assemblePages' #for quicker build only run a subset of build
            'htmllint'
            'notify:page'
        ]

    templates:
        files: [
            'src/js/RAMP/**/*.json'
        ]
        tasks: [
            'copy:templatesBuild'
            'notify:templates'
        ]

    js:
        options:
            spawn: false
        files: [
            'src/js/**/*.js'
        ]
        tasks: [
            'hint'
            'jsstyle'
            'copy:jsCore'
            'notify:js'
        ]

    css:
        options:
            spawn: false
        files: [
            'src/css/**/*.less'
        ]
        tasks: [
            'less'
            'autoprefixer'
            'notify:css'
        ]
    
    rampConfig:
        files: [
            'src/config.json'
        ]
        tasks: [
            'generateConfig'
        ]
    
    locales:
        files: [
            'src/locales/**/*.json'
        ]
        
        tasks: [
            #'build'
            'generateConfig'
            'assemble' #for quicker build only run a subset of build
            'htmllint'
            'notify:page'
            'copy:localesBuild'
        ]
    
    config:
        options:
            reload: true
        files: [
            'Gruntfile.coffee'
            'grunt/**/*.coffee'
        ]