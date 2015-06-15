module.exports =
    
    # 'Generates API docs.'
    'api':
        [
            'clean:yuidoc'
            'yuidoc'
            'replace:api_dojo'
            'replace:api_esri'
            'clean:docco'
            'docco'
            'notify:api'
        ]

    # 'Run full build to create an uminified development package.'
    'build':
        [
            'clean:build'
            'jsonlint:bower'
            'copy:build'
            'prepareLocale'
            'generateConfig' # generate config after copying locale files
            'assemblePages'
            'assemble:extra'
            'notify:page'
            'js:prep'
            'js:build'
            'css:build'
            'nfp:build'
            'notify:build'
        ]
    # extra pages to be assembled (to be overridden by themes as necessary)
    'assemble:extra': []

    # 'INTERNAL: Copies files (except JS and CSS) needed for a build.'
    'copy:build':
        [
            'copy:configBuild'
            'copy:polyfillBuild'
            'copy:wetboewBuild'
            'copy:assetsBuild'
            'copy:proxyBuild'
            'copy:localesBuild'
            'copy:templatesBuild'
            'notify:assets'
        ]

    #'INTERNAL: Copies files (except JS and CSS) needed for a distribution package.'
    'copy:dist':
        [
            'copy:configDist'
            'copy:polyfillDist'
            'copy:wetboewDist'
            'copy:assetsDist'
            'copy:configDist'
            'copy:proxyDist'
            'copy:localesDist'
            'copy:cssLibResDist'
            'copy:templatesDist'
        ]
        
    # 'Default task create both an unminified development and a minified distribution packages.'
    'default':
        [
            'dist'
        ]

    # 'Deploys a dist into the specified folder.'
    'deploy:build':
        [
            'build'
            'clean:deploy'
            'copy:deployBuild'
            'notify:deploy'
        ]

    # 'Deploys a dist into the specified folder.'
    'deploy:dist':
        [
            'dist'
            'clean:deploy'
            'copy:deployDist'
            'notify:deploy'
        ]

    # 'Create a minified distribution package.'
    'dist':
        [
            'clean:dist'
            'build'
            'copy:dist'
            'js:dist'
            'templatemin'
            'json-minify'
            'cssmin'
            'htmlmin'
            'htmllint'
            'useMinAssets'
            'imagemin'
            'notify:min'
            'tarball'
            'nfp:dist'
            'notify:dist'
        ]

    # 'INTERNAL: Prepare locale files'
    'prepareLocale':
        [
            'jsonlint:locales' # lint src locales
            'locale:check' # check src locales for consistence; assuming core locales are correct
            'locale:merge' # used for theme builds
        ]

    # 'INTERNAL: lints and generate language-specific configs from oneConfig and locale strings'
    'generateConfig':
        [
            'jsonlint:oneConfig'
            'zs3'
            'assembleConfigs'
            'jsonlint:generatedConfigs'
            'notify:generatedConfigsLint'
            'clean:oneConfig'
        ]

    # 'INTERNAL: Runs JSHint on JS code.'
    'hint':
        [
            'jshint'
            'notify:hint'
        ]

    # 'Only needed when the repo is first cloned. It\'s automatically run after \'npm install\''
    'init':
        [
            'thanks'
            'yuiapi:enhance'
        ]

    # 'INTERNAL: Concatenates, processes and copies all JS to the build folder.'
    'js:build':
        [
            'hint'
            'jsstyle'
            'concat:jsLib'
            'copy:jsCore'
            'copy:jsPlugins'
            'replace:jsCoreBuild'
            'js:build:after'
            'notify:js'
        ]

    # post build step for themes to override if they need to
    'js:build:after': []

    # 'INTERNAL: Minifies JS code.'
    'js:dist':
        [
            'uglify'
            'replace:jsCoreDist'
        ]

    # 'INTERNAL: Runs JSStyle on JS code.'
    'jsstyle':
        [
            'jscs'
            'notify:jsstyle'
        ]

    # 'Creates an unminified development package, starts a node server the specified port, watches for modified JS, CSS and other files, and reloads HTML page on change.'
    'serve:build':
        [
            'build'
            'connect:build'
            'watch'
        ]

    # 'Creates a minified distribution package and starts a node server on the specified port.'
    'serve:dist':
        [
            'dist'
            'connect:dist'
        ]

    # 'INTERNAL: Creates a tarball of the distribution package.'
    'tarball':
        [
            'clean:tarball'
            'compress'
            'notify:tarball'
        ]

    # 'INTERNAL: Add a not for production warning to the build.'
    'nfp:build':
        [
            'replace:nfpBuild'
            'nfp:file'
        ]

    # 'INTERNAL: Removes a not for production warning from the distribution package.'
    'nfp:dist':
        [
            'nfp:release'
        ]
