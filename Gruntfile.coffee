fs = require("fs")
path = require('path')

module.exports = (grunt) ->
    
    require('load-grunt-config') grunt,
        jitGrunt: 
            customTasksDir: path.join(process.cwd(), 'grunt/tasks')
            staticMappings:
                'notify_hooks': 'grunt-notify'
        configPath: [
            path.join(process.cwd(), 'grunt/options')
            path.join(process.cwd(), 'grunt_overrider/options')
        ]
    
    @registerTask(
        'default'
        'Default task create both an unminified development and a minified distribution packages.'
        [
            'dist'
        ]
    )

    @registerTask(
        'init'
        'Only needed when the repo is first cloned. It\'s automatically run after \'npm install\''
        [
            'hub'
            'thanks'
            'api:enhance'
        ]
    )

    @registerTask(
        'build'
        'Run full build to create an uminified development package.'
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
    )

    @registerTask(
        'quietbuild'
        'Run build without jscs.'
        [
            'clean:build'
            'copy:build'
            'assemble'
            'notify:page'
            'js:quietbuild'
            'css:build'
            'notify:build'
        ]
    )

    @registerTask(
        'copy:build'
        'INTERNAL: Copies files (except JS and CSS) needed for a build.'
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
    )

    @registerTask(
        'js:build'
        'INTERNAL: Concatenates, processes and copies all JS to the build folder.'
        [
            'hint'
            'jsstyle'
            'concat:jsLib'
            'copy:jsCore'
            'copy:jsPlugins'
            'replace:jsCoreBuild'
            'notify:js'               
        ]        
    )

    @registerTask(
        'hint'
        'INTERNAL: Runs JSHint on JS code.'
        [
            'jshint'
            'notify:hint'
        ]
    )

    @registerTask(
        'jsstyle'
        'INTERNAL: Runs JSStyle on JS code.'
        [
            'jscs'
            'notify:jsstyle'
        ]
    )

    @registerTask(
        'dist'
        'Create a minified distribution package.'
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
    )

    @registerTask(
        'copy:dist'
        'INTERNAL: Copies files (except JS and CSS) needed for a distribution package.'
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
    )

    @registerTask(
        'js:dist'
        'INTERNAL: Minifies JS code.'
        [
            'uglify'
            'replace:jsCoreDist'
        ]
    )

    @registerTask(
        'serve:build'
        'Creates an unminified development package, starts a node server the specified port, watches for modified JS, CSS and other files, and reloads HTML page on change.'
        [
            'build'
            'connect:build'
            'watch'
        ]
    )

    @registerTask(
        'jscs:shutyoface'
        'A nice quiet build to test stuff without JSCS complaining on every keypress.'
        [
            'quietbuild'
            'connect:build'
            'watch'
        ]
    )

    @registerTask(
        'serve:dist'
        'Creates a minified distribution package and starts a node server on the specified port.'
        [
            'dist'
            'connect:dist'
        ]
    )

    @registerTask(
        'templatemin'
        'INTERNAL: Converts templates into (almost) proper JSON.'
        () ->
            templates = grunt.file.expand(
                'dist/js/RAMP/**/*.json'
            )

            templates.forEach(
                ( file ) ->

                    contents = grunt.file.read file
                    ## chaining functions fails; maybe it's related to the version of CoffeeScript Grunt uses
                    # strip comments
                    contents = contents.replace(/`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|\/\*[^]*?\*\/|\/\/.*\n?/g,
                            (s) -> 
                                 if s.charAt(0) == '/' 
                                     return ''
                                  else 
                                     return s                                
                        )
                    # strip hard breaks and tabs
                    contents = contents.replace /[\n\r\t]/g, ''
                    # strip some of the white space
                    contents = contents.replace />\s*?</g, '><'

                    # stripping all space causes errors
                    #contents = contents.replace /(\s){2,}/g, '><'

                    grunt.file.write file, contents
            )
    )

    @registerTask(
        'useMinAssets'
        'Replace unmin WET references with the min paths for HTML files.'
        () ->
            htmlFiles = grunt.file.expand(
                [ 'dist/**/*.html', 'dist/js/lib/lib.min.js' ]
            )

            htmlFiles.forEach(
                ( file ) ->

                    contents = grunt.file.read file 
                    #contents = contents.replace( /\/unmin/g, "" )
                    contents = contents.replace 'js/lib/lib.js', 'js/lib/lib.min.js'
                    contents = contents.replace 'css/lib/lib.css', 'css/lib/lib.min.css'
                    contents = contents.replace 'css/theme.less.css', 'css/theme.less.min.css'
                    contents = contents.replace(/((?=\/wet-boew\/)[^\"]+?\.)(js|css)/g, '$1min.$2')

                    grunt.file.write file, contents 
            )
    )

    @registerTask(
        'tarball'
        'INTERNAL: Creates a tarball of the distribution package.'
        [
            'clean:tarball'
            'compress'
            'notify:tarball'
        ]
    )

    @registerTask(
        'deploy'
        'Deploys a dist into the specified folder.'
        [
            'dist'
            'clean:deploy'
            'copy:deploy'
            'notify:deploy'
        ]
    )

    @registerTask(
        'api'
        'Generates API docs.'
        [
            'clean:yuidoc'
            'yuidoc'
            'replace:api_dojo'
            'replace:api_esri'
            'clean:docco'
            'docco'
            'notify:api'
        ]
    )

    @registerTask(
        'api:enhance'
        'INTERNAL: Updates API doc templates.'
        () ->
            done = @async()
            themeFileName = "./node_modules/grunt-contrib-yuidoc/node_modules/yuidocjs/themes/default/layouts/main.handlebars"
            optionsFileName = "./node_modules/grunt-contrib-yuidoc/node_modules/yuidocjs/themes/default/partials/options.handlebars"
            builderFileName = "./node_modules/grunt-contrib-yuidoc/node_modules/yuidocjs/lib/builder.js"
            q = "this.NATIVES = Y.merge(options.exnatives, this.NATIVES);"
            data = undefined

            data = fs.readFileSync(optionsFileName,
                encoding: 'utf8'
            )

            if data
                data = data.replace("<input type=\"checkbox\" id=\"api-show-inherited\" checked>", "<input type=\"checkbox\" id=\"api-show-inherited\">")
                fs.writeFileSync optionsFileName, data
            data = fs.readFileSync(themeFileName,
                encoding: 'utf8'
            )

            if data
                data = data.replace("<h1><img src=\"{{projectLogo}}\" title=\"{{projectName}}\"></h1>", "<h1><img src=\"{{projectLogo}}\" title=\"{{projectName}}\">" + grunt.config("pkg.subname") + "</h1>")
                fs.writeFileSync themeFileName, data
            data = fs.readFileSync(builderFileName,
                encoding: 'utf8'
            )

            if data and data.indexOf(q) is -1
                data = data.replace("Y.DocBuilder = function (options, data) {", "Y.DocBuilder = function (options, data) {\n" + q)
                data = data.replace("return url + name;", "return url.indexOf(\"developer.mozilla.org\") !== -1 ? url + name : url;")
                fs.writeFileSync builderFileName, data
            
            done()
    )

    @registerTask(
        'generateConfig'
        'INTERNAL: lints and generate language-specific configs from oneConfig and locale strings'
        [   
            'jsonlint:oneConfig'
            'zs3'
            'jsonlint:locales'
            'assembleConfigs'
        ]            
    )
    
    @registerTask(
        'assembleConfigs'
        'INTERNAL'
        () ->
            languages = ['en', 'fr']
            tasks = []
            
            languages.forEach(
                ( lang ) ->
                    json = grunt.file.readJSON 'src/locales/' + lang + '-CA/translation.json'
                    
                    grunt.config 'replace.config-' + lang,
                        options:
                            patterns: [
                                json: json
                            ]
                        files: [
                            src: 'src/config.json'
                            dest: 'build/config.' + lang + '.json'
                        ]
                        
                    tasks.push 'replace:config-' + lang
            )       
            
            tasks.push 'notify:configGenerated'
            tasks.push 'jsonlint:generatedConfigs'
            tasks.push 'notify:generatedConfigsLint'
            
            #console.log grunt.config 'replace'
            #console.log tasks
            grunt.task.run tasks
    )

    @registerTask(
        'release'
        'INTERNAL Uploads release builds to GitHub releases.'
        () ->
            tasks = [
                'github-release'
                'gh-pages'
            ]
        
            if process.env.TRAVIS_TAG ##&& (process.env.TRAVIS_BRANCH == 'develop' || process.env.TRAVIS_BRANCH == 'master') 
                
                if process.env.TRAVIS_TAG.match /^v\d+\.\d+\.\d+$/
                    grunt.config 'github-release.options.release.body', '* [' + process.env.TRAVIS_TAG + ' release notes](http://ramp-pcar.github.io/versions/' + process.env.TRAVIS_TAG + '-en.html)'
                
                grunt.task.run tasks
    )

    @util.linefeed = "\n"


    # These plugins provide necessary tasks.
    
    @task.run 'notify_hooks'

    #on watch events configure jshint:all to only run on changed file
    @event.on 'watch', (action, filepath) ->
        grunt.config 'jshint.files', filepath
        grunt.config 'jscs.main.files.src', filepath

        # update what the notify tell
        grunt.config 'notify.hint.options.title', filepath.replace(/^.*[\\\/]/, "")
        grunt.config 'notify.jscs.options.title', filepath.replace(/^.*[\\\/]/, "")

    require( 'time-grunt' )( grunt )
    @