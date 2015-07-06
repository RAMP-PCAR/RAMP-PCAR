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
            'src/js/RAMP/**/*.html'
        ]
        tasks: [
            'copy:templatesBuild'
            'htmlmin:angularPartialsBuild'
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
            # need to copy config source to build to generate language-specific config files
            'copy:configBuild'
            'generateConfig'            
        ]
    
    locales:
        files: [
            'src/locales/**/*.json'
        ]
        
        tasks: [
            #'build'
            'copy:configBuild'
            'copy:localesBuild'
            'prepareLocale'
            'generateConfig'
            'assemblePages' #for quicker build only run a subset of build
            #'htmllint' do not lint pages since only translations changed
            'notify:page'
        ]
    
    config:
        options:
            reload: true
        files: [
            'Gruntfile.coffee'
            'grunt/**/*.coffee'
        ]