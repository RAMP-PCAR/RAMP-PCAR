/*global require, module */

var fs = require('fs'),
    path = require('path'),
    request = require('request'),
    extend = require('util')._extend,
    csvToJson = require("csvtojson").core.Converter;

module.exports = function (grunt) {
    var tempJsLibToClear = [],
        tempCssLibToClear = [],

        localeStrings = {
            en: {},
            fr: {}
        };

    function getExtension(filename) {
        var ext = path.extname(filename || '').split('.');
        return ext[ext.length - 1];
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        hintColors: '<%= pkg.hintColors %>',

        notify_hooks: {
            options: {
                enabled: true,
                max_jshint_notifications: 0 // maximum number of notifications from jshint output
            }
        },

        notify: {
            hint: {
                options: {
                    message: 'JSHint is a GO.' //required
                }
            },

            jscs: {
                options: {
                    message: 'JSCS-Checker is a GO.' //required
                }
            },

            css: {
                options: {
                    message: 'CSS is a GO.' //required
                }
            },

            js: {
                options: {
                    message: 'JavaScript is a GO.' //required
                }
            },

            page: {
                options: {
                    message: 'Pages are a GO.' //required
                }
            },

            api: {
                options: {
                    message: 'API docs are a GO.' //required
                }
            },

            build: {
                options: {
                    message: 'The Build is ready!' //required
                }
            },

            deploy: {
                options: {
                    title: 'Build is Deployed', // optional
                    message: 'Done, thanks!' //required
                }
            },

            clean: {
                options: {
                    message: 'Mopping up is done!'
                }
            },

            bump: {
                options: {
                    message: ''
                }
            },

            tarball: {
                options: {
                    message: 'Tarball is created!'
                }
            }
        },

        clean: {
            options: {
                force: true
            },

            rampJsBefore: [
                'build/js/'
            ],

            rampJsAfter: [
                'build/js/lib/_temp/',
                tempJsLibToClear
            ],

            rampCssBefore: [
                'build/css/'
            ],

            rampCssAfter: [
                'build/css/_temp/',
                'build/css/lib/_temp/',

                'src/css/**/*.pref.css',
                'src/css/**/*.less.css',
                'src/css/**/*.min.css',
                '!src/css/**/*.less.pref.css',
                '!src/css/lib/**/*.*',

                tempCssLibToClear
            ],

            pageBefore: [
                'build/*.html',
                'src/pages/*-map.html',
                'src/pages/*-carte.html',
                '!*-src.html'
            ],

            pageAfter: [
                'src/pages/*-map.html',
                'src/pages/*-carte.html',
                '!*-src.html'
            ],

            assets: {
                expand: true,

                cwd: 'build/',
                src: ['<%= pkg.ramp.assetsToCopy %>']
            },

            build: [
                'build/'
            ],

            version: [
                'build/*.version'
            ],

            tarball: [
                'dist/'
            ],

            yuidoc: ['<%= yuidocconfig.options.outdir %>'],

            docco: ['<%= pkg.ramp.docco.outdir %>']
        },

        concat: {
            options: {
                stripBanners: true,
                // define a string to put between each file in the concatenated output
                separator: ''
            },

            rampJsLib: {
                files: [{
                    src: ['build/js/lib/_temp/**/*.js'],
                    dest: 'build/js/lib/lib.min.js'
                }]
            },

            rampCssCore: {
                files: [{
                    //src: ['build/css/_temp/**/*.css'],
                    //dest: 'build/css/ramp.min.css'

                    //src: ['<%= pkg.ramp.cssFolder %>/build/_temp/**/*.css'],
                    //dest: '<%= pkg.ramp.cssFolder %>/build/ramp.min.css'
                }]
            },

            rampCssLib: {
                files: [{
                    src: ['build/css/lib/_temp/**/*.css'],
                    dest: 'build/css/lib/lib.min.css'
                }]
            }
        },

        uglify: {
            rampJsCore: {
                options: {
                    compress: {
                        drop_console: true // strip all console statements from generated code
                    },
                    report: 'min',
                    sourceMap: false,
                    sourceMapIncludeSources: false,
                    preserveComments: false,
                    // the banner is inserted at the top of the output
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy HH:MM:ss") %> : v. <%= pkg.version %> \n * \n * <%= pkg.description %> \n **/\n'
                },

                files: [{
                    expand: true,

                    cwd: 'src/js/RAMP/',
                    src: '**/*.js',
                    dest: 'build/js/RAMP/'
                }]
            },

            rampJsLib: {
                options: {
                    report: 'min'
                },
                files: [{
                    expand: true,
                    cwd: 'src/js/lib/',
                    src: '<%= pkg.ramp.jsLibToUglify %>',
                    dest: 'src/js/lib/',

                    rename: function (dest, src) {
                        var nd = dest + src.replace(".js", ".min.js");
                        tempJsLibToClear.push(nd);
                        return nd;
                    }
                }]
            }
        },

        replace: {
            options: {
                force: true
            },

            rampJsCore: {
                options: {
                    patterns: [{
                        match: 'src/',
                        replacement: 'build/'
                    }, {
                        match: /$/,
                        replacement: '\nconsole.log("<%= pkg.ramp.arcticFox %>");'
                    }],
                    usePrefix: false
                },
                files: [{
                    src: 'build/js/RAMP/RAMP-starter.js',
                    dest: 'build/js/RAMP/RAMP-starter.js'
                }]
            },

            stringsEn: {
                options: {
                    patterns: [{
                        match: 'dateModifiedDate',
                        replacement: '<%= grunt.template.today("yyyy-mm-dd") %>'
                    }, {
                        json: localeStrings.en
                    }]
                },

                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: '*-map.html',
                    dest: 'build/'
                }]
            },

            stringsFr: {
                options: {
                    patterns: [{
                        match: 'dateModifiedDate',
                        replacement: '<%= grunt.template.today("yyyy-mm-dd") %>'
                    }, {
                        json: localeStrings.fr
                    }]
                },

                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: '*-carte.html',
                    dest: 'build/'
                }]
            },

            api_esri: {
                options: {
                    patterns: [{
                        json: '<%= yuidocconfig.options.exlinks.esri %>'
                    }],
                    prefix: 'href="',
                    preservePrefix: true,
                    preserveOrder: false
                },

                files: [{
                    expand: true,
                    cwd: '<%= yuidocconfig.options.outdir %>',
                    src: ['**/*.html', '!**/*-src.html'],
                    dest: '<%= yuidocconfig.options.outdir %>'
                }]
            },

            api_dojo: {
                options: {
                    patterns: [{
                        json: '<%= yuidocconfig.options.exlinks.dojo %>'
                    }],
                    prefix: 'href="',
                    preservePrefix: true,
                    preserveOrder: false
                },

                files: [{
                    expand: true,
                    cwd: '<%= yuidocconfig.options.outdir %>',
                    src: ['**/*.html', '!**/*-src.html'],
                    dest: '<%= yuidocconfig.options.outdir %>'
                }]
            },

            api_other: {
                options: {
                    patterns: [
                        /*{
                        match: /href=".*?\|/ig,
                        replacement: 'href="'
                    }*/
                    ],
                    usePrefix: false
                },

                files: [{
                    expand: true,
                    cwd: '<%= yuidocconfig.options.outdir %>',
                    src: ['**/*.html', '!**/*-src.html'],
                    dest: '<%= yuidocconfig.options.outdir %>'
                }]
            }
        },

        jshint: {
            files: ['src/js/RAMP/**/*.js'],
            options: {
                reporter: require('jshint-stylish-plain'),

                // options here to override JSHint defaults
                // enforce
                bitwise: true,
                camelcase: false, //true, //(optional)
                curly: true,
                eqeqeq: true,
                es3: false,
                forin: true,
                freeze: true,
                immed: true,
                indent: false,
                latedef: true,
                newcap: true,
                noarg: true,
                noempty: false, //(sometimes want "do nothing" functions)
                nonew: true,
                plusplus: false,
                quotmark: false,
                undef: true,
                unused: true, //"strict",
                strict: true,
                trailing: true,

                // relax

                asi: false,
                boss: false,
                debug: false,
                eqnull: true,
                esnext: false,
                evil: false,
                //expr: false, (?)
                funcscope: false,
                gcl: false,
                globalstrict: false,
                iterator: false,
                lastsemic: false,
                laxbreak: false,
                laxcomma: false,
                loopfunc: false,
                maxerr: 50, // (default is good)
                moz: false,
                multistr: false,
                notypeof: false,
                proto: false,
                scripturl: false,
                smarttabs: true,
                shadow: false,
                sub: false,
                supernew: false,
                validthis: false,
                noyield: false,

                globals: {
                    jQuery: true,
                    $: true,
                    console: true,
                    module: true,
                    document: true
                }
            }
        },

        watch: {
            wjs: {
                options: {
                    spawn: false
                },
                files: ['src/js/RAMP/**/*.js'],
                tasks: ['js'] //, 'build:bump-only-build']
                //tasks: ['hint', 'jsstyle']
            },

            wcss: {
                files: ['src/css/**/*.less'],
                tasks: ['css'] //, 'build:bump-only-build']
            },

            wpage: {
                files: [
                    'src/ramp-src.html',
                    'src/pages/**/*.html',
                    'src/includes/**/*.txt'
                ],
                tasks: ['page', 'assets'] //, 'build:bump-only-build']
            },

            wtemplate: {
                files: ['src/js/RAMP/Modules/templates/*.json'],
                tasks: ['copy:templates'] //, 'build:bump-only-build']
            }
        },

        copy: {
            options: {
                force: true
            },

            templates: {
                files: [{
                    expand: true,
                    cwd: 'src/js/RAMP/Modules/templates',
                    src: '**',
                    dest: 'build/js/RAMP/Modules/templates'
                }]
            },

            rampJsLib: {
                files: [{
                    expand: true,
                    cwd: 'src/js/lib/',
                    src: ['<%= pkg.ramp.jsLibToConcat %>'],
                    dest: 'build/js/lib/_temp/'
                }]
            },

            rampJsLibResources: {
                /*files: [{
                    expand: true,
                    cwd: 'src/js/',
                    src: ['<%= pkg.ramp.jsLibToConcat %>'],
                    dest: 'build/js/lib/_temp/'
                }]*/
                //files: '<%= pkg.ramp.jsLibResourcesToCopy %>'
            },

            rampJsExtra: {
                files: [{
                    expand: true,
                    cwd: 'src/js',
                    src: ['<%= pkg.ramp.jsExtraToCopy %>'],
                    dest: 'build/js'
                }]
            },

            rampCssCore: {
                files: [{
                    expand: true,
                    cwd: 'src/css/',
                    src: ['**/theme.less.min.css', '!lib/**/*.*'],
                    dest: 'build/css/'
                }]
            },

            rampCssLib: {
                files: [{
                    expand: true,
                    cwd: 'src/css/lib/',
                    src: ['<%= pkg.ramp.cssLibToConcat %>'],
                    dest: 'build/css/lib/_temp/'
                }]
            },

            cssLibResourcesToCopy: {
                files: [{
                    expand: true,
                    cwd: 'src/css/lib/',
                    src: ['<%= pkg.ramp.cssLibResourcesToCopy %>'],
                    dest: 'build/css/lib/'
                }]
            },

            assets: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: '<%= pkg.ramp.assetsToCopy %>',
                    dest: 'build/'
                }]
            },

            deploy: {
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: '**/*.*',
                    dest: '<%= pkg.ramp.deployFolder %>/'
                }]
            }
        },

        cssmin: {
            rampCssCore: {
                files: [{
                    expand: true,
                    cwd: 'src/css/',
                    src: ['**/*.pref.css', '!lib/**/*.*'],
                    dest: 'src/css/',

                    rename: function (dest, src) {
                        return dest + src.replace(".pref.css", ".min.css");
                    }
                }]
            },

            rampCssLib: {
                files: [{
                    expand: true,

                    cwd: 'src/css/lib/',
                    src: '<%= pkg.ramp.cssLibToMinify %>',
                    dest: 'src/css/lib/',

                    rename: function (dest, src) {
                        var nd = dest + src.replace(".css", ".min.css");
                        tempCssLibToClear.push(nd);
                        return nd;
                    }
                }]
            }
        },

        autoprefixer: {
            options: {
                map: false,
                browsers: ['> 1%', 'last 5 versions', 'Firefox ESR', 'Opera 12.1']
            },

            rampCssCore: {
                files: [{
                    expand: true,
                    cwd: 'src/css/',
                    src: ['**/*.css', '!**/*.pref.css', '!**/*.min.css', '!lib/**/*.*'],
                    dest: 'src/css/',

                    rename: function (dest, src) {
                        return dest + src.replace(".css", ".pref.css");
                    }
                }]
            }
        },

        chmod: {
            options: {
                mode: '666'
            },

            rampCssCore: {
                src: [
                    'src/css/**/theme.less.pref.css',
                    '!src/css/lib/**/*.*'
                ]
            }
        },

        less: {
            rampLessCore: {
                files: [{
                    expand: true,

                    cwd: 'src/css/',
                    src: '**/theme.less',
                    dest: 'src/css/',

                    rename: function (dest, src) {
                        return dest + src.replace(".less", ".less.css");
                    }
                }]
            }
        },

        docco: {
            debug: {
                src: ['<%= pkg.ramp.docco.path %>/**/*.js'],
                options: {
                    output: '<%= pkg.ramp.docco.outdir %>'
                }
            }
        },

        yuidocconfig: grunt.file.readJSON('yuidoc.json'),

        yuidoc: {
            compile: '<%= yuidocconfig %>'
        },

        bump: {
            options: {
                files: ['package.json', 'yuidoc.json'],
                updateConfigs: ['pkg', 'yuidocconfig'],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['.'], //['package.json', 'yuidoc.json'], // '-a' for all files
                createTag: false,
                //tagName: 'v%VERSION%',
                //tagMessage: 'Version %VERSION%',
                push: false, //, false
                //pushTo: 'http://sncr01wbintfs1:8080/tfs/DC/_git/RAMP' //'upstream',
                //pushTo: 'http://tfs.int.ec.gc.ca:8080/tfs/dc/_git/RAMP', //'upstream',
                pushTo: 'origin', //'upstream',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
            }
        },

        complexity: {
            generic: {
                src: ['src/js/RAMP/**/*.js'],
                options: {
                    breakOnErrors: true,
                    jsLintXML: 'report.xml', // create XML JSLint-like report
                    checkstyleXML: 'checkstyle.xml', // create checkstyle report
                    errorsOnly: false, // show only maintainability errors
                    cyclomatic: [3, 7, 12], // or optionally a single value, like 3
                    halstead: [8, 13, 20], // or optionally a single value, like 8
                    maintainability: 100,
                    hideComplexFunctions: true // only display maintainability
                }
            }
        },

        htmlmin: {
            page: {
                options: { // Target options: https://github.com/kangax/html-minifier#options-quick-reference
                    removeComments: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true
                },
                files: { // Dictionary of files
                }
            }
        },

        jscs: {
            main: {
                options: {
                    requireCurlyBraces: [
                        'if',
                        'else',
                        'for',
                        'while',
                        'do',
                        'try',
                        'catch'
                        //'case',
                        //'default'
                    ],
                    requireSpaceAfterKeywords: [
                        'if',
                        'else',
                        'for',
                        'while',
                        'do',
                        'switch',
                        'return',
                        'try',
                        'catch'
                    ],
                    requireSpaceBeforeBlockStatements: true,
                    requireParenthesesAroundIIFE: true, //JSHint: immed
                    requireSpacesInFunctionExpression: {
                        //beforeOpeningRoundBrace: true,
                        beforeOpeningCurlyBrace: true
                    },
                    requireSpacesInAnonymousFunctionExpression: {
                        beforeOpeningRoundBrace: true,
                        beforeOpeningCurlyBrace: true
                    },
                    requireSpacesInNamedFunctionExpression: {
                        //beforeOpeningRoundBrace: true,
                        beforeOpeningCurlyBrace: true
                    },
                    requireSpacesInFunctionDeclaration: {
                        //beforeOpeningRoundBrace: true,
                        beforeOpeningCurlyBrace: true
                    },
                    requireMultipleVarDecl: true,
                    requireBlocksOnNewline: 1,
                    disallowEmptyBlocks: true,
                    //disallowSpacesInsideObjectBrackets: true,
                    disallowSpacesInsideArrayBrackets: true,
                    disallowSpacesInsideParentheses: true,
                    disallowQuotedKeysInObjects: true,
                    disallowSpaceAfterObjectKeys: true,
                    requireCommaBeforeLineBreak: true,
                    //requireOperatorBeforeLineBreak: ?

                    requireSpaceAfterPrefixUnaryOperators: [/*"++", "--",*/ "+", /*"-",*/ "~"/*, "!"*/],
                    disallowSpaceAfterPrefixUnaryOperators: ["++", "--", /*"+", */"-", /*"~",*/ "!"],

                    //requireSpaceBeforePostfixUnaryOperators: ["++", "--"],
                    disallowSpaceBeforePostfixUnaryOperators: [
                        '++',
                        '--'
                    ],
                    requireSpaceBeforeBinaryOperators: [
                        '+',
                        '-',
                        '/',
                        '*',
                        '=',
                        '==',
                        '===',
                        '!=',
                        '!=='
                    ],
                    requireSpaceAfterBinaryOperators: [
                        '+',
                        '-',
                        '/',
                        '*',
                        '=',
                        '==',
                        '===',
                        '!=',
                        '!=='
                    ],
                    disallowSpaceBeforeBinaryOperators: [
                        //"=",
                        ","//,
                        /*"+",
                        "-",
                        "/",
                        "*",
                        "==",
                        "===",
                        "!=",
                        "!=="*/
                        // etc
                    ],
                    /*disallowSpaceAfterBinaryOperators: [
                        "=",
                        ",",
                        "+",
                        "-",
                        "/",
                        "*",
                        "==",
                        "===",
                        "!=",
                        "!=="
                        // etc
                    ],*/
                    disallowImplicitTypeConversion: [
                        'numeric',
                        'boolean',
                        'binary',
                        'string'
                    ],

                    requireSpacesInConditionalExpression: {
                        "afterTest": true,
                        "beforeConsequent": true,
                        "afterConsequent": true,
                        "beforeAlternate": true
                    },
                    /*disallowSpacesInConditionalExpression: {
                        "afterTest": true,
                        "beforeConsequent": true,
                        "afterConsequent": true,
                        "beforeAlternate": true
                    },*/

                    //requireCamelCaseOrUpperCaseIdentifiers: true,
                    disallowTrailingComma: true,
                    disallowKeywords: ['with'],
                    disallowMultipleLineStrings: true,
                    disallowMultipleLineBreaks: true,
                    disallowMixedSpacesAndTabs: true, // spaces???
                    disallowKeywordsOnNewLine: ['else'],
                    requireCapitalizedConstructors: true,
                    safeContextKeyword: ['that'],
                    requireDotNotation: true,
                    disallowYodaConditions: true,
                    validateJSDoc: {
                        checkParamNames: true,
                        checkRedundantParams: true,
                        requireParamTypes: true
                    }//,
                    //reporterOutput: 'jscs.txt'
                    //config: '.jscs-secondary.json'
                },
                files: {
                    src: ['src/js/RAMP/**/*.js']
                }
            }
        },

        htmlbuild: {
            dist: {
                src: [
                        'src/pages/<%= pkg.ramp.theme %>-map.html',
                        'src/pages/<%= pkg.ramp.theme %>-carte.html'
                ],
                dest: 'build/',
                options: {
                    beautify: false,
                    //prefix: '//some-cdn',
                    relative: true,

                    sections: {
                        head: {
                            wetCss: 'src/pages/<%= pkg.ramp.theme %>/head.wetCss.html'
                        },

                        body: {
                            wetHeader: 'src/pages/<%= pkg.ramp.theme %>/body.wetHeader.html',
                            wetJs: 'src/pages/<%= pkg.ramp.theme %>/body.wetJs.html',
                            wetFooter: 'src/pages/<%= pkg.ramp.theme %>/body.wetFooter.html'
                        }
                    },

                    styles: {
                        head: {
                            rampCssLib: 'build/css/lib/lib.min.css',
                            rampCssCore: 'build/css/<%= pkg.ramp.theme %>/theme.less.min.css'
                        }
                    },

                    scripts: {
                        body: {
                            rampJsLib: 'build/js/lib/lib.min.js',
                            rampJsCore: 'build/js/RAMP/RAMP-starter.js'
                        }
                    },

                    data: {
                        // Data to pass to templates
                        version: "0.1.0",
                        title: "test"
                    }
                }
            }
        },

        compress: {
            tar: {
                options: {
                    mode: 'tar',
                    //archive: 'dist/<%= pkg.name %> <%= pkg.version %>.tar',
                    archive: function () {
                        var buildVersion
                            = fs.existsSync('build/') ?
                            fs.readdirSync('build/')
                            .filter(function (name) {
                                return getExtension(name) === 'version';
                            }) : [];
                        buildVersion = buildVersion[0] ? buildVersion[0].replace('.version', '') : null;
                        return 'dist/' + (buildVersion || grunt.config('pkg.name') + ' ' + grunt.config('pkg.version')) + '.tar';
                    }
                },
                files: [
                   {
                       expand: 'true',
                       cwd: 'build/',
                       src: ['**/*']
                   }
                ]
            },

            zip: {
                options: {
                    mode: 'zip',
                    archive: function () {
                        var buildVersion
                            = fs.existsSync('build/') ?
                            fs.readdirSync('build/')
                            .filter(function (name) {
                                return getExtension(name) === 'version';
                            }) : [];
                        buildVersion = buildVersion[0] ? buildVersion[0].replace('.version', '') : null;
                        return 'dist/' + (buildVersion || grunt.config('pkg.name') + ' ' + grunt.config('pkg.version')) + '.zip';
                    },
                    level: 9
                },
                files: [
                   {
                       expand: 'true',
                       cwd: 'build/',
                       src: ['**/*']
                   }
                ]
            }
        },
        'json-minify': {
            build: {
                files: 'build/config.*.json'
            }
        }
    });

    //# Load Tasks

    grunt.loadNpmTasks('grunt-notify');
    // This is required if you use any options.
    grunt.task.run('notify_hooks');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-docco');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-complexity');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks("grunt-jscs-checker");
    grunt.loadNpmTasks('grunt-html-build');
    grunt.loadNpmTasks('grunt-chmod');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-json-minify');

    //# !Load Tasks

    //# Register Tasks

    // CLEAN
    grunt.registerTask('cleanAll', ['clean', 'notify:clean', 'hint:cleanUp']);

    // HINT
    grunt.registerTask('hint:cleanUp', function () {
        var done = this.async();
        grunt.file.delete('.stylishcolors', {
            force: true
        });
        done();
    });

    grunt.registerTask('hint', ['jshint', 'hint:cleanUp', 'notify:hint']);

    // JSCS
    grunt.registerTask('jsstyle', ['jscs', 'notify:jscs']);

    // WATCH
    // watch and hint a file on change
    grunt.registerTask('wjs', ['watch:wjs']);
    //grunt.registerTask('wjse', ['watch:wjse']);
    // watch and compile CSS on change
    grunt.registerTask('wcss', ['watch:wcss']);
    // watch and build HTML pages on change
    grunt.registerTask('wpage', ['watch:wpage']);

    // STRINGS
    // load and parse locale strings from an csv file
    grunt.registerTask('csvStrings', function (suffix) {
        var done = this.async(),
            fileName = 'src/assets/strings_' + suffix + '.csv',
            csvToJsonConverter = new csvToJson();

        csvToJsonConverter.on("end_parsed", function (jsonObj) {
            if (jsonObj.csvRows.length === 0) {
                console.log('File', fileName, "is empty or doesn't exit");
            } else {
                jsonObj.csvRows.map(function (elm) {
                    localeStrings[suffix][elm.key] = elm.value;
                });
            }

            done();
        });

        console.log("Loading", fileName);
        csvToJsonConverter.from(fileName);
    });

    // load and parse locale strings from the config file either local or returned by the service
    grunt.registerTask('configStrings', function (suffix) {
        var done = this.async(),
            fileName = grunt.config('pkg.ramp.configFileLocation');

        if (fileName) {
            fileName = fileName.replace('{lang}', suffix);
        } else {
            done();
            return;
        }

        function parseStrings(json) {
            localeStrings[suffix] = extend(localeStrings[suffix], json.stringResources);
        }

        console.log("Loading", fileName);

        fs.readFile(fileName, function (err, data) {
            if (err) {
                request(fileName,
                    function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            parseStrings(JSON.parse(JSON.parse(body).json));
                            done();
                        } else {
                            console.log("Error loading file", fileName);
                            done();
                        }
                    }
                );
            } else {
                parseStrings(JSON.parse(data));
                done();
            }
        });
    });

    grunt.registerTask('cake', function () {
        var done = this.async();

        console.log("The cake is a lie\nThe cake is a lie\nThe cake is a lie\nThe cake is a lie...");
        done();
    });

    // OTHER
    //
    grunt.registerTask('thanks', function () {
        var done = this.async(),
            fileName = './node_modules/grunt/lib/grunt/fail.js';

        fs.readFile(fileName, {
            encoding: "utf8"
        },
            function (err, data) {
                if (err) {
                    console.log("Error loading file", fileName, err);
                    done();
                } else {
                    data = data.replace('Done, without errors.', 'Done, thanks!');
                    fs.writeFileSync(fileName, data);
                    done();
                }
            });
    });

    // BUILD
    grunt.registerTask('build:bump-only-build', function () {
        //console.log(a, b);

        grunt.task.run('bump-only:build');
        grunt.config('notify.bump.options.message', 'Version bumped to <%= pkg.version %>');
        grunt.task.run('notify:bump');
    });

    // ASSETS

    grunt.registerTask('assets', ['clean:assets', 'copy:assets']);

    // JS
    grunt.registerTask('jsClean', ['clean:rampJsBefore', 'clean:rampJsAfter']);
    grunt.registerTask('jsCopy', ['copy:rampJsLib', 'copy:rampJsLibResources', 'copy:rampJsExtra', 'copy:templates']);
    grunt.registerTask('jsConcat', ['concat:rampJsLib']);
    grunt.registerTask('jsReplace', ['replace:rampJsCore']);

    grunt.registerTask('js', ['hint', 'jsstyle', 'clean:rampJsBefore', 'uglify', 'jsCopy', 'jsConcat', 'jsReplace', 'clean:rampJsAfter', 'notify:js']);

    // CSS
    grunt.registerTask('lessCss', ['less:rampLessCore']);
    grunt.registerTask('prefix', ['chmod:rampCssCore', 'autoprefixer:rampCssCore']);
    grunt.registerTask('cssClean', ['clean:rampCssBefore', 'clean:rampCssAfter']);
    grunt.registerTask('cssCopy', ['copy:rampCssCore', 'copy:rampCssLib']);
    grunt.registerTask('cssConcat', ['concat:rampCssLib']); //'concat:rampCssCore'

    grunt.registerTask('css', ['clean:rampCssBefore', 'lessCss', 'prefix', 'cssmin', 'cssCopy', 'cssConcat', 'clean:rampCssAfter', 'copy:cssLibResourcesToCopy', 'notify:css']);

    // PAGES
    grunt.registerTask('pageStrings', ['csvStrings:en', 'csvStrings:fr', 'configStrings:en', 'configStrings:fr']);
    grunt.registerTask('pageReplace', ['replace:stringsEn', 'replace:stringsFr']);

    grunt.registerTask('updateConfig', function (key, value) {
        console.log(key, value);
        grunt.config(key, value);
    });

    grunt.registerTask('pageBuild', function () {
        var done = this.async(),
            themes = grunt.config('pkg.ramp.themes'),
            tasks = [],
            filesToMinify = {};

        themes.map(function (elm) {
            var themeFiles,
                fileNameFr = elm + '-' + grunt.config('pkg.ramp.pageToBuildEn') + '.html',
                fileNameEn = elm + '-' + grunt.config('pkg.ramp.pageToBuildFr') + '.html';

            filesToMinify['build/' + fileNameFr] = 'build/' + fileNameFr;
            filesToMinify['build/' + fileNameEn] = 'build/' + fileNameEn;

            themeFiles = [
                { src: 'src/ramp-src.html', dest: 'src/pages/' + fileNameEn },
                { src: 'src/ramp-src.html', dest: 'src/pages/' + fileNameFr }
            ];

            grunt.config('replace.theme-' + elm, {
                options: {
                    patterns: [{
                        match: 'rampTheme',
                        replacement: elm
                    }]
                },
                files: themeFiles
            });

            tasks.push('replace:theme-' + elm);

            tasks.push('updateConfig:pkg.ramp.theme:' + elm);
            tasks.push('htmlbuild');
        });

        grunt.config('htmlmin.page.files', filesToMinify);

        tasks.push('pageReplace');
        tasks.push('htmlmin:page');
        tasks.push('clean:pageAfter');
        tasks.push('notify:page');

        grunt.task.run(tasks);
        done();
    });

    grunt.registerTask('page', ['pageStrings', 'clean:pageBefore', 'pageBuild']);

    // API - Docs
    grunt.registerTask('api:enhance', function () {
        var done = this.async(),
            themeFileName = './node_modules/grunt-contrib-yuidoc/node_modules/yuidocjs/themes/default/layouts/main.handlebars',
            optionsFileName = './node_modules/grunt-contrib-yuidoc/node_modules/yuidocjs/themes/default/partials/options.handlebars',
            builderFileName = './node_modules/grunt-contrib-yuidoc/node_modules/yuidocjs/lib/builder.js',
            q = 'this.NATIVES = Y.merge(options.exnatives, this.NATIVES);',
            data;

        data = fs.readFileSync(optionsFileName, {
            encoding: "utf8"
        });
        if (data) {
            data = data.replace('<input type="checkbox" id="api-show-inherited" checked>', '<input type="checkbox" id="api-show-inherited">');
            fs.writeFileSync(optionsFileName, data);
        }

        data = fs.readFileSync(themeFileName, {
            encoding: "utf8"
        });
        if (data) {
            data = data.replace('<h1><img src="{{projectLogo}}" title="{{projectName}}"></h1>', '<h1><img src="{{projectLogo}}" title="{{projectName}}">{{projectName}}</h1>');
            fs.writeFileSync(themeFileName, data);
        }

        data = fs.readFileSync(builderFileName, {
            encoding: "utf8"
        });
        if (data && data.indexOf(q) === -1) {
            data = data.replace('Y.DocBuilder = function (options, data) {', 'Y.DocBuilder = function (options, data) {\n' + q);
            data = data.replace('return url + name;', 'return url.indexOf("developer.mozilla.org") !== -1 ? url + name : url;');
            fs.writeFileSync(builderFileName, data);
        }

        done();
    });

    grunt.registerTask('api', ['clean:yuidoc', 'api:enhance', 'yuidoc', 'replace:api_dojo', 'replace:api_esri', 'clean:docco', 'docco', 'notify:api']);

    grunt.registerTask('force', 'turns the --force option ON',
        function (value) {
            if (value === 'true') {
                grunt.option('force', true);
            } else {
                grunt.option('force', false);
            }
        });

    // BUILD
    grunt.registerTask('build', ['cleanAll', 'css', 'js', 'page', /*'api',*/ 'assets', 'json-minify', 'version', 'tarball', 'notify:build']);
    grunt.registerTask('build:deploy', ['cleanAll', 'css', 'js', 'page', /*'api',*/ 'assets', 'json-minify', 'version', 'notify:build']);

    // DEPLOY
    grunt.registerTask('clean:deploy', function () {
        var done = this.async();

        grunt.config('clean.deploy_', grunt.config('pkg.ramp.deployFolder'));
        grunt.task.run('clean:deploy_');

        done();
    });

    grunt.registerTask('tarball', ['clean:tarball', 'compress', 'notify:tarball']);

    grunt.registerTask('version', function () {
        //var fileName = grunt.config('pkg.ramp.deployFolder') + "/" + grunt.config('pkg.name') + " " + grunt.config('pkg.version') + ".version";
        var fileName = "build/" + grunt.config('pkg.name') + " " + grunt.config('pkg.version') + ".version";

        if (grunt.file.exists(fileName)) {
            grunt.file.delete(fileName, {
                force: true
            });
        }
        grunt.file.write(fileName, {
            force: true
        });
    });

    grunt.registerTask('deploy', ['build:deploy', 'clean:deploy', 'copy:deploy', 'notify:deploy']);

    grunt.registerTask('default', ['build']);

    //# !Register Tasks

    //# Register Options

    var target = grunt.option('target') || grunt.option('tr') || null,
        output = grunt.option('output') || grunt.option('o') || null,
        hintColorFile = '.stylishcolors';

    if (target) {
        console.log(target);

        grunt.config('jshint.files', 'src/js/RAMP/' + target);
        grunt.config('watch.wjs.files', 'src/js/RAMP/' + target);
        grunt.config('jscs.main.files.src', 'src/js/RAMP/' + target);

        // update what the notify tell
        grunt.config('notify.hint.options.title', grunt.config('jshint.files').replace(/^.*[\\\/]/, ''));
    }

    if (output) {
        output = output === true ? 'jsHintOutput.txt' : output;

        if (grunt.file.exists(hintColorFile)) {
            grunt.file.delete(hintColorFile, {
                force: true
            });
        }
        grunt.config('jshint.options.reporterOutput', output);
    } else {
        grunt.file.write(hintColorFile, JSON.stringify(grunt.config('hintColors')), {
            force: true
        });
    }

    if (grunt.option('source')) {
        grunt.config('uglify.rampJsCore.options.sourceMap', true);
        grunt.config('uglify.rampJsCore.options.sourceMapIncludeSources', true);
    }

    // on watch events configure jshint:all to only run on changed file
    grunt.event.on('watch', function (action, filepath) {
        grunt.config('jshint.files', filepath);
        grunt.config('jscs.main.files.src', filepath);

        // update what the notify tell
        grunt.config('notify.hint.options.title', filepath.replace(/^.*[\\\/]/, ''));
        grunt.config('notify.jscs.options.title', filepath.replace(/^.*[\\\/]/, ''));
    });

    //# !Register Options
};