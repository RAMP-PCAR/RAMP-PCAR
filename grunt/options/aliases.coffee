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
            'copy:build'
            'assemble'
            'notify:page'
            'js:prep'
            'js:build'
            'css:build'
            'notify:build'
        ]

    # 'INTERNAL: Copies files (except JS and CSS) needed for a build.'
    'copy:build': 
        [
            'generateConfig'
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
    'deploy':
        [
            'dist'
            'clean:deploy'
            'copy:deploy'
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
            'useMinAssets'
            'imagemin'
            'notify:min'
            'tarball'
            'notify:dist'
        ]

    # 'INTERNAL: lints and generate language-specific configs from oneConfig and locale strings'
    'generateConfig':
        [   
            'locale:check'
            'jsonlint:oneConfig'
            'zs3'
            'jsonlint:locales'
            'assembleConfigs'
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
            'hub'
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
            'notify:js'               
        ]        

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

    # 'Run build without jscs.'
    'quietbuild':
        [
            'clean:build'
            'copy:build'
            'assemble'
            'notify:page'
            'js:quietbuild'
            'css:build'
            'notify:build'
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

    # 'A nice quiet build to test stuff without JSCS complaining on every keypress.'
    'serve:qbuild':
        [
            'quietbuild'
            'connect:build'
            'watch'
        ]

    # 'INTERNAL: Creates a tarball of the distribution package.'
    'tarball':
        [
            'clean:tarball'
            'compress'
            'notify:tarball'
        ]