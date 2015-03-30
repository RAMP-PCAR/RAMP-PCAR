module.exports = 
    # used by theme build
    
    configBuild:
        files: [
            expand: true
            cwd: '<%= corepkg.corepath %>src'
            src: 'config.json'
            dest: 'build/'
        # overrider core config with local if exists
        ,
            expand: true
            cwd: 'src'
            src: 'config.json'
            dest: 'build/'
        ]

    configDist:
        expand: true
        cwd: 'build/'
        src: 'config.*.json'
        dest: 'dist/'

    wetboewBuild:
        expand: true
        cwd: 'lib/wet-boew/dist/unmin'
        src: [
            '**/*.*'
            '!ajax/**/*.*'
            '!**/logo.*'
            '!**/favicon*.*'
            '!demos/**/*.*'
            '!docs/**/*.*'
            '!test/**/*.*'
            '!theme/**/*.*'
            '!*.html'
        ]
        dest: 'build/js/lib/wet-boew/'

    wetboewDist:
        expand: true
        cwd: 'lib/wet-boew/dist'
        src: [
            '**/*.*'
            '!ajax/**/*.*'
            '!**/logo.*'
            '!**/favicon*.*'
            '!demos/**/*.*'
            '!docs/**/*.*'
            '!test/**/*.*'
            '!theme/**/*.*'
            '!unmin/**/*.*'
            '!*.html'
        ]
        dest: 'dist/js/lib/wet-boew/'

    polyfillBuild:
        expand: true
        cwd: 'src/js/polyfill'
        src: '*.*'
        dest: 'build/js/polyfill'

    polyfillDist:
        expand: true
        cwd: 'src/js/polyfill'
        src: '*.*'
        dest: 'dist/js/polyfill'

    assetsBuild:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/assets'
            src: '**/*.*'
            dest: 'build/assets'
        ,
            expand: true
            cwd: 'src/assets'
            src: '**/*.*'
            dest: 'build/assets'
        ]

    assetsDist:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/assets'
            src: '**/*.*'
            dest: 'dist/assets'
        ,
            expand: true
            cwd: 'src/assets'
            src: '**/*.*'
            dest: 'dist/assets'
        ]

    proxyBuild:
        expand: true
        cwd: 'proxy'
        src: '**/*.*'
        dest: 'build/proxy'

    proxyDist:
        expand: true
        cwd: 'proxy'
        src: '**/*.*'
        dest: 'dist/proxy'
        
    localesBuild:
        expand: true
        cwd: 'src/locales'
        src: '**/*.json'
        dest: 'build/locales'

    localesDist:
        expand: true
        cwd: 'src/locales'
        src: '**/*.json'
        dest: 'dist/locales'

    templatesBuild:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/js/RAMP/Modules/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Modules/templates'
        ,
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/js/RAMP/Tools/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Tools/templates'
        ,
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/js/RAMP/Utils/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Utils/templates'
        ,
            expand: true
            cwd: 'src/js/RAMP/Modules/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Modules/templates'
        ,
            expand: true
            cwd: 'src/js/RAMP/Tools/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Tools/templates'
        ,
            expand: true
            cwd: 'src/js/RAMP/Utils/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Utils/templates'
        ]

    templatesDist:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/js/RAMP/Modules/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Modules/templates'
        ,
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/js/RAMP/Tools/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Tools/templates'
        ,
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/js/RAMP/Utils/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Utils/templates'
        ,
            expand: true
            cwd: 'src/js/RAMP/Modules/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Modules/templates'
        ,
            expand: true
            cwd: 'src/js/RAMP/Tools/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Tools/templates'
        ,
            expand: true
            cwd: 'src/js/RAMP/Utils/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Utils/templates'
        ]

    jsCore:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= corepkg.corepath %>src/js/RAMP/'
            src: '**/*.js'
            dest: 'build/js/RAMP/'
        ,
            expand: true
            cwd: 'src/js/RAMP/'
            src: '**/*.js'
            dest: 'build/js/RAMP/'
        ]

    jsPlugins:
        expand: true
        cwd: 'src/js/plugins/'
        src: '**/*.js'
        dest: 'build/js/plugins/'

    cssLibResBuild:
        expand: true
        cwd: 'lib/fontawesome/'
        src: 'fonts/**/*.*'
        dest: 'build/css/'

    cssLibResDist:
        expand: true
        cwd: 'lib/fontawesome/'
        src: 'fonts/**/*.*'
        dest: 'dist/css/'

    deploy:
        expand: true
        cwd: 'dist'
        src: '**/*.*'
        dest: '<%= pkg.ramp.deployFolder %>/'

    demo:
        expand: true
        cwd: 'dist'
        src: '**/*.*'
        dest: 'demos/NRSTC/' + process.env.TRAVIS_TAG + '/<%= pkg.name %>' 

    api:
        expand: true
        cwd: 'docs'
        src: '**/*.*'
        dest: 'api/' + process.env.TRAVIS_TAG + '/' 