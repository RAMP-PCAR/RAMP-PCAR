fs = require("fs")

module.exports = (grunt) ->

    @registerTask(
        'default'
        'Default task create a distribution package.'
        [
            'dist'
        ]
    )

    @registerTask(
        'init'
        'Only needed when the repo is first cloned'
        [
            'hub'
            'modernizr'
            'thanks'
            'api:enhance'
        ]
    )

    @registerTask(
        'build'
        'Run full build.'
        [
            'clean:build'
            'copy:build'
            'assemble'
            'notify:page'
            'js:build'
            'css:build'
            'notify:build'
        ]
    )

    @registerTask(
        'copy:build'
        'INTERNAL: Copies files (except JS and CSS) needed for a build'
        [
            'copy:configBuild'
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
        'INTERNAL: Copies and concatenates all JS to the build folder'
        ->
            grunt.config(
                'concat.jsLib.src'
                smartExpand(
                    'lib/'
                    grunt.config 'pkg.ramp.concat.jsLib'
                    [
                        'src/js/lib/jquery.dataTables.pagination.ramp.js'
                        'src/js/lib/jquery.ui.navigation.ramp.js'
                    ]
                )
            )

            #console.log(grunt.config('concat.jsLib'))

            grunt.task.run [
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
        'css:build'
        'INTERNAL: '
        ->
            grunt.config(
                'concat.cssLib.src'
                smartExpand(
                    'lib/'
                    grunt.config 'pkg.ramp.concat.cssLib'
                )
            )

            grunt.task.run [
                'less'
                'autoprefixer'
                'concat:cssLib'
                'copy:cssLibResBuild'
                'notify:css'
            ]
    )

    @registerTask(
        'hint'
        'INTERNAL: Runs JSHint and JSStyle on JS code.'
        [
            'jshint'
            'notify:hint'
        ]
    )

    @registerTask(
        'jsstyle'
        'INTERNAL: '
        [
            'jscs'
            'notify:jsstyle'
        ]
    )

    @registerTask(
        'dist'
        'Produces the production files'
        [
            'clean:dist'
            'copy:dist'
            'build'
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
        'INTERNAL: Copies files (except JS and CSS) needed for a distribution package'
        [
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
        [
            'uglify'
            'replace:jsCoreDist'
        ]
    )

    @registerTask(
        'serve:build'
        'INTERNAL: Create unminified docs'
        [
            'build'
            'connect:build'
            'watch'
        ]
    )

    @registerTask(
        'serve:dist'
        'INTERNAL: Create unminified docs'
        [
            'dist'
            'connect:dist'
        ]
    )

    @registerTask(
        'templatemin'
        'INTERNAL: Converts templates into proper JSON.'
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
        'Replace unmin WET references with the min paths for HTML files'
        () ->
            htmlFiles = grunt.file.expand(
                'dist/**/*.html'
            )

            htmlFiles.forEach(
                ( file ) ->

                    contents = grunt.file.read file 
                    #contents = contents.replace( /\/unmin/g, "" )
                    contents = contents.replace 'js/lib/lib.js', 'js/lib/lib.min.js'
                    contents = contents.replace 'css/lib/lib.css', 'css/lib/lib.min.css'
                    contents = contents.replace 'css/theme.less.css', 'css/theme.less.min.css'
                    contents = contents.replace /((?=\/wet-boew\/)[^\"]+?\.)(js|css)/g, '$1min.$2'

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
        'Deploys a dist into the specified folder'
        [
            'dist'
            'clean:deploy'
            'copy:deploy'
            'notify:deploy'
        ]
    )

    @registerTask(
        'api'
        'Creating API docs'
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
        'INTERNAL: '
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
        'thanks'
        ->
            done = @async()
            fileName = './node_modules/grunt/lib/grunt/fail.js'

            fs.readFile fileName,
                encoding: 'utf8'
            , (err, data) ->
                if err
                    console.log 'Error loading file', fileName, err
                    done()
                else
                    data = data.replace 'Done, without errors.', 'Done, thanks!'
                    fs.writeFileSync fileName, data
                    done()
    )

    smartExpand = ( cwd, arr, extra ) ->    
        # determine file order here and concat to arr
        extra = extra or []
        arr.map(( file ) ->
            cwd + file
        ).concat extra

    @util.linefeed = "\n"
    # Project configuration.
    @initConfig

        # Metadata.
        pkg: grunt.file.readJSON('package.json')

        yuidocconfig: grunt.file.readJSON('yuidoc.json')

        notify:
            hint:
                options:
                    message: "JSHint is a GO."

            jsstyle:
                options:
                    message: "JSCS-Checker is a GO."

            css:
                options:
                    message: "CSS is a GO."

            js:
                options:
                    message: "JavaScript is a GO."

            page:
                options:
                    message: "Pages are a GO."

            assets:
                options:
                    message: "Assets are a GO."

            api:
                options:
                    message: "API docs are a GO."

            build:
                options:
                    message: "The Build is ready!"

            dist:
                options:
                    message: "The Production package is ready!"

            deploy:
                options:
                    title: "Build is Deployed"
                    message: "Done, thanks!"

            min:
                options:
                    message: "Minification is complete."        

            clean:
                options:
                    message: "Mopping up is done!"

            tarball:
                options:
                    message: "Tarball is created!"

        copy:
            configBuild:
                expand: true
                cwd: 'src'
                src: 'config.*.json'
                dest: 'build/'

            configDist:
                expand: true
                cwd: 'src'
                src: 'config.*.json'
                dest: 'dist/'

            wetboewBuild:
                expand: true
                cwd: "lib/wet-boew/dist/unmin"
                src: [
                    "**/*.*"
                    "!ajax/**/*.*"
                    "!**/logo.*"
                    "!**/favicon*.*"
                    "!demos/**/*.*"
                    "!docs/**/*.*"
                    "!test/**/*.*"
                    "!theme/**/*.*"                 
                    "!*.html"
                ]
                dest: "build/js/lib/wet-boew/"

            wetboewDist:
                expand: true
                cwd: "lib/wet-boew/dist"
                src: [
                    "**/*.*"
                    "!ajax/**/*.*"
                    "!**/logo.*"
                    "!**/favicon*.*"
                    "!demos/**/*.*"
                    "!docs/**/*.*"
                    "!test/**/*.*"
                    "!theme/**/*.*"
                    "!unmin/**/*.*"
                    "!*.html"
                ]
                dest: "dist/js/lib/wet-boew/"

            assetsBuild:
                expand: true
                cwd: 'src/assets'
                src: '**/*.*'
                dest: 'build/assets'

            assetsDist:
                expand: true
                cwd: 'src/assets'
                src: '**/*.*'
                dest: 'dist/assets'

            proxyBuild:
                expand: true
                cwd: 'src/proxy'
                src: '**/*.*'
                dest: 'build/proxy'
            
            proxyDist:
                expand: true
                cwd: 'src/proxy'
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
                    expand: true
                    cwd: 'src/js/RAMP/Modules/templates'
                    src: '**/*.json'
                    dest: 'build/js/RAMP/Modules/templates'
                ,
                    expand: true
                    cwd: 'src/js/RAMP/Tools/templates'
                    src: '**/*.json'
                    dest: 'build/js/RAMP/Tools/templates'
                ]

            templatesDist:
                files: [
                    expand: true
                    cwd: 'src/js/RAMP/Modules/templates'
                    src: '**/*.json'
                    dest: 'dist/js/RAMP/Modules/templates'
                ,
                    expand: true
                    cwd: 'src/js/RAMP/Tools/templates'
                    src: '**/*.json'
                    dest: 'dist/js/RAMP/Tools/templates'
                ]

            jsCore:
                expand: true
                cwd: 'src/js/RAMP/'
                src: '**/*.js'
                dest: 'build/js/RAMP/'

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

        assemble:
            options:
                data: [
                    "lib/wet-boew/site/data/**/*.{yml,json}"
                    "site/data/**/*.{yml,json}"
                ]
                helpers: [
                    "lib/wet-boew/site/helpers/helper-*.js"
                    "site/helpers/helper-*.js"
                ]
                partials: [
                    "lib/wet-boew/site/includes/**/*.hbs"
                    "site/includes/**/*.hbs",
                ]
                layoutdir: "site/layouts"
                layout: "default.hbs"

                i18next:
                    countryCode: 'CA'
                    debug: false
                    localePath: 'src/locales'
                    languages: ['en', 'fr']

            ramp:
                options:
                    assets: 'build/js/lib/wet-boew'
                    rampAssets: 'assets'
                    
                    environment:
                        jqueryVersion: '2.1.1'
                        #jqueryVersion: "<%= jqueryVersion.version %>"
                        #jqueryOldIEVersion: "<%= jqueryOldIEVersion.version %>"
                    flatten: true
                    plugins: ['assemble-contrib-i18n']
                    i18n:
                        languages: ['en', 'fr']
                        templates: [
                            'site/pages/ramp.hbs'
                        ]
                dest: 'build/'
                src: '!*.*'

            ajax:
                options:
                    flatten: true
                    plugins: ['assemble-contrib-i18n']
                    i18n:
                        languages: ['en', 'fr']
                        templates: [
                            'site/pages/ajax/*.hbs'
                        ]
                dest: 'build/ajax/'
                src: '!*.*'

        htmlmin:
            options:
                collapseWhitespace: true
                preserveLineBreaks: false
                removeAttributeQuotes: false
            all:
                cwd: 'build'
                src: '**/*.html'
                dest: 'dist'
                expand: true

        imagemin:
            all:
                cwd: 'dist/assets'
                src: '**/*.{png,jpg,gif}'
                dest: 'dist/assets'
                expand: true

        concat:
            options:
                stripBanners: true
                separator: ''

            jsLib:
                dest: 'build/js/lib/lib.js'

            cssLib:
                dest: 'build/css/lib/lib.css'

        cssmin:
            dist:
                expand: true
                cwd: 'build/css/'
                src: [
                    'theme.less.css' 
                    'lib/lib.css'
                ]
                dest: 'dist/css/'
                rename: (dest, src) ->
                        dest + src.replace('.css', '.min.css');

        uglify:
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

        'json-minify':
            configDist:
                files: 'dist/config.*.json'
                
            localeDist:
                files: 'dist/locales/**/*.json'  

            templatesDist:
                files: 'dist/js/RAMP/**/*.json'

        less:
            cssCore:
                expand: true
                cwd: 'src/css/'
                src: '**/theme.less'
                dest: 'build/css/'
                rename: (dest, src) ->
                        dest + src.replace('.less', '.less.css');

        autoprefixer:
            options:
                map: false
                browsers: [
                    '> 1%'
                    'bb >= 7'
                    'ff >= 17'
                    'ie > 8'
                    'ios 5'
                    'last 5 versions'
                    'Firefox ESR'
                    'Opera 12.1'
                ]

            cssCore:
                expand: true
                cwd: 'build/css/'
                src: [
                    "**/*.css"
                    '!fonts/**/*.*'
                    "!lib/**/*.*"
                ]
                dest: 'build/css/'
                #rename: (dest, src) ->
                    #dest + src.replace('.css', '.pref.css')

        replace:
            options:
                force: true

            jsCoreBuild:
                options:
                    patterns: [
                        match: /$/
                        replacement: '\nconsole.log(\"<%= pkg.ramp.rampASCII %>\");'
                    ]
                    usePrefix: false

                files: [
                    src: 'build/js/RAMP/RAMP-starter.js'
                    dest: 'build/js/RAMP/RAMP-starter.js'
                ]

            jsCoreDist:
                options:
                    patterns: [
                        match: /$/
                        replacement: '\nconsole.log(\"<%= pkg.ramp.rampASCII %>\");'
                    ]
                    usePrefix: false

                files: [
                    src: 'dist/js/RAMP/RAMP-starter.js'
                    dest: 'dist/js/RAMP/RAMP-starter.js'
                ]

            api_esri:
                options:
                    patterns: [json: '<%= yuidocconfig.options.exlinks.esri %>']
                    prefix: 'href="'
                    preservePrefix: true
                    preserveOrder: false

                files: [
                    expand: true
                    cwd: '<%= yuidocconfig.options.outdir %>'
                    src: [
                        '**/*.html'
                        '!**/*-src.html'
                    ]
                    dest: '<%= yuidocconfig.options.outdir %>'
                ]

            api_dojo:
                options:
                    patterns: [json: '<%= yuidocconfig.options.exlinks.dojo %>']
                    prefix: 'href="'
                    preservePrefix: true
                    preserveOrder: false

                files: [
                    expand: true
                    cwd: '<%= yuidocconfig.options.outdir %>'
                    src: [
                        '**/*.html'
                        '!**/*-src.html'
                    ]
                    dest: '<%= yuidocconfig.options.outdir %>'
                ]

        modernizr:
            devFile: "lib/modernizr/modernizr-custom.js"
            outputFile: "lib/modernizr/modernizr-custom.js"
            extra:
                shiv: true
                printshiv: false
                load: true
                mq: false
                cssclasses: true
                css3: true
                cssanimations: true
                csstransitions: true
            extensibility:
                addtest: false
                prefixed: false
                teststyles: false
                testprops: false
                testallprops: false
                hasevents: false
                prefixes: false
                domprefixes: false
            uglify: false
            parseFiles: false

        jshint:
            files: [
                'src/js/RAMP/**/*.js'
                'src/js/plugins/**/*.js'
                '!src/js/lib/**/*.js'
            ]
            options:                
                # options here to override JSHint defaults
                # enforce
                bitwise: true
                camelcase: false #true, //(optional)
                curly: true
                eqeqeq: true
                es3: false
                forin: true
                freeze: true
                immed: true
                indent: false
                latedef: true
                newcap: true
                noarg: true
                noempty: false #(sometimes want "do nothing" functions)
                nonew: true
                plusplus: false
                quotmark: false
                undef: true
                unused: true #"strict",
                strict: true
                trailing: true
                
                # relax
                asi: false
                boss: false
                debug: false
                eqnull: true
                esnext: false
                evil: false
                
                #expr: false, (?)
                funcscope: false
                gcl: false
                globalstrict: false
                iterator: false
                lastsemic: false
                laxbreak: false
                laxcomma: false
                loopfunc: false
                maxerr: 50 # (default is good)
                moz: false
                multistr: false
                notypeof: false
                proto: false
                scripturl: false
                smarttabs: true
                shadow: false
                sub: false
                supernew: false
                validthis: false
                noyield: false

        jscs: 
            main:
                options:
                    requireCurlyBraces: [
                        "if"
                        "else"
                        "for"
                        "while"
                        "do"
                        "try"
                        "catch"
                    ]
                    requireSpaceAfterKeywords: [
                        "if"
                        "else"
                        "for"
                        "while"
                        "do"
                        "switch"
                        "return"
                        "try"
                        "catch"
                    ]
                    requireSpaceBeforeBlockStatements: true
                    requireParenthesesAroundIIFE: true #JSHint: immed
                    requireSpacesInFunctionExpression:
                        beforeOpeningCurlyBrace: true

                    requireSpacesInAnonymousFunctionExpression:
                        beforeOpeningRoundBrace: true
                        beforeOpeningCurlyBrace: true

                    requireSpacesInNamedFunctionExpression:
                        beforeOpeningCurlyBrace: true

                    requireSpacesInFunctionDeclaration:
                        beforeOpeningCurlyBrace: true

                    requireMultipleVarDecl: true
                    requireBlocksOnNewline: 1
                    disallowEmptyBlocks: true
                    disallowSpacesInsideArrayBrackets: true
                    disallowSpacesInsideParentheses: true
                    disallowQuotedKeysInObjects: true
                    disallowSpaceAfterObjectKeys: true
                    requireCommaBeforeLineBreak: true
                    requireSpaceAfterPrefixUnaryOperators: [
                        "+"
                        "~"
                    ]
                    disallowSpaceAfterPrefixUnaryOperators: [
                        "++"
                        "--"
                        "-"
                        "!"
                    ]
                    disallowSpaceBeforePostfixUnaryOperators: [
                        "++"
                        "--"
                    ]
                    requireSpaceBeforeBinaryOperators: [
                        "+"
                        "-"
                        "/"
                        "*"
                        "="
                        "=="
                        "==="
                        "!="
                        "!=="
                    ]
                    requireSpaceAfterBinaryOperators: [
                        "+"
                        "-"
                        "/"
                        "*"
                        "="
                        "=="
                        "==="
                        "!="
                        "!=="
                    ]
                    disallowSpaceBeforeBinaryOperators: [","]
                    disallowImplicitTypeConversion: [
                        "numeric"
                        "boolean"
                        "binary"
                        "string"
                    ]
                    requireSpacesInConditionalExpression:
                        afterTest: true
                        beforeConsequent: true
                        afterConsequent: true
                        beforeAlternate: true

                    
                    #requireCamelCaseOrUpperCaseIdentifiers: true,
                    disallowTrailingComma: true
                    disallowKeywords: ["with"]
                    disallowMultipleLineStrings: true
                    disallowMultipleLineBreaks: true
                    disallowMixedSpacesAndTabs: true # spaces???
                    disallowKeywordsOnNewLine: ["else"]
                    requireCapitalizedConstructors: true
                    safeContextKeyword: ["that"]
                    requireDotNotation: true
                    disallowYodaConditions: true
                    validateJSDoc:
                        checkParamNames: true
                        checkRedundantParams: true
                        requireParamTypes: true

                files:
                    src: [
                        'src/js/RAMP/**/*.js'
                        'src/js/plugins/**/*.js'
                        '!src/js/lib/**/*.js'
                    ]

        connect:
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

        watch:
            options:
                livereload: true
    
            pages:
                files: [
                    'site/**/*.hbs'
                ]
                tasks: [
                    #'build'
                    'assemble' #for quicker build only run a subset of build
                    'notify:page'
                ]

            templates:
                files: [
                    'src/js/RAMP/**/*.json'
                ]
                tasks: [
                    'copy:templates'
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
            
            config:
                files: [
                    'Gruntfile.coffee'
                ]

        clean:
            optiosn:
                force: true
            
            build:[
                'build'
            ]

            dist: [
                'dist'
            ]

            tarball: [
                'tarball'
            ]

            yuidoc: [
                '<%= yuidocconfig.options.outdir %>'
            ]

            docco: [
            ]

            deploy:
                options:
                    ##'no-write': true
                    force: false
                
                src: [
                    ##'<%= pkg.ramp.deployFolder %>'
                ]

        hub:
            "wet-boew":
                src: [
                    "lib/wet-boew/Gruntfile.coffee"
                ]
                tasks: [
                    "dist"
                ]

        compress:
            tar:
                options:
                    mode: 'tar'
                    archive: 'tarball/<%= pkg.name %> <%= pkg.version %>.tar'
                files: [
                    expand: true
                    src: '**/*'
                    cwd: 'dist/'
                ]

            zip:
                options:
                    mode: 'zip'
                    archive: 'tarball/<%= pkg.name %> <%= pkg.version %>.zip',
                    level: 9

                files: [
                    expand: true
                    src: '**/*'
                    cwd: 'dist/'
                ]

        yuidoc:
            compile: '<%= yuidocconfig %>'

        docco:
            src: '<%= pkg.ramp.docco.path %>/**/*.js'
            options:
                output: '<%= pkg.ramp.docco.outdir %>'

    # These plugins provide necessary tasks.
    @loadNpmTasks 'assemble'
    @loadNpmTasks 'grunt-autoprefixer'
    @loadNpmTasks 'grunt-contrib-clean'
    @loadNpmTasks 'grunt-contrib-compress'
    @loadNpmTasks 'grunt-contrib-concat'
    @loadNpmTasks 'grunt-contrib-connect'
    @loadNpmTasks 'grunt-contrib-copy'
    @loadNpmTasks 'grunt-contrib-cssmin'
    @loadNpmTasks 'grunt-contrib-htmlmin'
    @loadNpmTasks 'grunt-contrib-imagemin'
    @loadNpmTasks 'grunt-contrib-jshint'
    @loadNpmTasks 'grunt-contrib-less'
    @loadNpmTasks 'grunt-contrib-uglify'
    @loadNpmTasks 'grunt-contrib-watch'
    @loadNpmTasks 'grunt-contrib-yuidoc'
    @loadNpmTasks 'grunt-docco'
    @loadNpmTasks 'grunt-hub'
    @loadNpmTasks 'grunt-jscs-checker'
    @loadNpmTasks 'grunt-json-minify'
    @loadNpmTasks 'grunt-modernizr'
    @loadNpmTasks 'grunt-newer'
    @loadNpmTasks 'grunt-notify'
    @loadNpmTasks 'grunt-replace'
        
    @task.run "notify_hooks"

    #on watch events configure jshint:all to only run on changed file
    @event.on "watch", (action, filepath) ->
        grunt.config "jshint.files", filepath
        grunt.config "jscs.main.files.src", filepath

        # update what the notify tell
        grunt.config "notify.hint.options.title", filepath.replace(/^.*[\\\/]/, "")
        grunt.config "notify.jscs.options.title", filepath.replace(/^.*[\\\/]/, "")

    require( "time-grunt" )( grunt )
    @