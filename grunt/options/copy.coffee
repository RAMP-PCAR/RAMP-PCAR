module.exports = 
    # used by theme build
    
    configBuild:
        files: [
            expand: true
            cwd: '<%= pkg.core.path %>src'
            src: 'config.json'
            dest: 'build/'
        # overrider core config with local if exists
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src'
            src: 'config.json'
            dest: 'build/'
        ]

    configDist:
        expand: true
        cwd: 'build/'
        src: 'config.*.json'
        dest: 'dist/'

    wetboewBuild:
        files: [
            expand: true
            cwd: '<%= pkg.core.wet %>dist/unmin'
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
        ,
            expand: true
            cwd: '<%= pkg.theme.wet %>dist/unmin'
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
        ]

    wetboewDist:
        files: [
            expand: true
            cwd: '<%= pkg.core.wet %>dist'
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
        ,
            expand: true
            cwd: '<%= pkg.theme.wet %>dist'
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
        ]

    polyfillBuild:
        files: [
            expand: true
            cwd: '<%= pkg.core.path %>src/js/polyfill'
            src: '*.*'
            dest: 'build/js/polyfill'
        ,   
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/polyfill'
            src: '*.*'
            dest: 'build/js/polyfill'
        ]

    polyfillDist:
        files: [
            expand: true
            cwd: '<%= pkg.core.path %>src/js/polyfill'
            src: '*.*'
            dest: 'dist/js/polyfill'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/polyfill'
            src: '*.*'
            dest: 'dist/js/polyfill'
        ]

    assetsBuild:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/assets'
            src: '**/*.*'
            dest: 'build/assets'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/assets'
            src: '**/*.*'
            dest: 'build/assets'
        ]

    assetsDist:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/assets'
            src: '**/*.*'
            dest: 'dist/assets'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/assets'
            src: '**/*.*'
            dest: 'dist/assets'
        ]

    proxyBuild:
        files: [
            expand: true
            cwd: '<%= pkg.core.path %>proxy'
            src: '**/*.*'
            dest: 'build/proxy'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>proxy'
            src: '**/*.*'
            dest: 'build/proxy'
        ]

    proxyDist:
        files: [
            expand: true
            cwd: '<%= pkg.core.path %>proxy'
            src: '**/*.*'
            dest: 'dist/proxy'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>proxy'
            src: '**/*.*'
            dest: 'dist/proxy'
        ]
    
    # theme locales are merged with core locales in the build folder        
    localesBuild:
        expand: true
        cwd: '<%= pkg.core.path %>src/locales'
        src: '**/*.json'
        dest: 'build/locales'

    localesDist:
        expand: true
        cwd: 'build/locales'
        src: '**/*.json'
        dest: 'dist/locales'

    templatesBuild:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/js/RAMP/Modules/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Modules/templates'
        ,
            expand: true
            cwd: '<%= pkg.core.path %>src/js/RAMP/Modules/partials'
            src: '**/*.html'
            dest: 'build/js/RAMP/Modules/partials'
        ,
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/js/RAMP/Tools/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Tools/templates'
        ,
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/js/RAMP/Utils/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Utils/templates'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/RAMP/Modules/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Modules/templates'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/RAMP/Modules/partials'
            src: '**/*.html'
            dest: 'build/js/RAMP/Modules/partials'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/RAMP/Tools/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Tools/templates'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/RAMP/Utils/templates'
            src: '**/*.json'
            dest: 'build/js/RAMP/Utils/templates'
        ]

    templatesDist:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/js/RAMP/Modules/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Modules/templates'
        ,
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/js/RAMP/Tools/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Tools/templates'
        ,
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/js/RAMP/Utils/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Utils/templates'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/RAMP/Modules/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Modules/templates'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/RAMP/Tools/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Tools/templates'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/RAMP/Utils/templates'
            src: '**/*.json'
            dest: 'dist/js/RAMP/Utils/templates'
        ]

    jsCore:
        files: [
            # used by theme build
            expand: true
            cwd: '<%= pkg.core.path %>src/js/RAMP/'
            src: '**/*.js'
            dest: 'build/js/RAMP/'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/RAMP/'
            src: '**/*.js'
            dest: 'build/js/RAMP/'
        ]

    jsPlugins:
        files: [
            expand: true
            cwd: '<%= pkg.core.path %>src/js/plugins/'
            src: '**/*.js'
            dest: 'build/js/plugins/'
        ,
            expand: true
            cwd: '<%= pkg.theme.path %>src/js/plugins/'
            src: '**/*.js'
            dest: 'build/js/plugins/'
        ]

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

    deployBuild:
        expand: true
        cwd: 'build'
        src: '**/*.*'
        dest: '<%= pkg.deployFolder %>/v<%= pkg.version %>/<%= pkg.name %>'

    deployDist:
        expand: true
        cwd: 'dist'
        src: '**/*.*'
        dest: '<%= pkg.deployFolder %>/v<%= pkg.version %>/<%= pkg.name %>'

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

    tarballDist:
        expand: true
        cwd: 'tarball'
        src: '*.zip'
        dest: process.env.TRAVIS_TAG + '/<%= pkg.name %>/'