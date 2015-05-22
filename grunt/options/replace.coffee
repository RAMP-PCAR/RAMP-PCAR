module.exports = 
    options:
        force: true

    # add ASCII art to the end of the lib file in dev build
    jsCoreBuild:
        options:
            patterns: [
                match: /$/
                replacement: '\nconsole.log(\"<%= pkg.core.ramp.rampASCII %>\");'
            ]
            usePrefix: false

        files: [
            src: 'build/js/lib/lib.js'
            dest: 'build/js/lib/lib.js'
        ]

    # add ASCII art to the end of the lib file in dist build
    jsCoreDist:
        options:
            patterns: [
                match: /$/
                replacement: '\nconsole.log(\"<%= pkg.core.ramp.rampASCII %>\");'
            ]
            usePrefix: false

        files: [
            src: 'dist/js/lib/lib.min.js'
            dest: 'dist/js/lib/lib.min.js'
        ]

    api_esri:
        options:
            patterns: [json: '<%= pkg.yuiconfig.options.exlinks.esri %>']
            prefix: 'href="'
            preservePrefix: true
            preserveOrder: false

        files: [
            expand: true
            cwd: '<%= pkg.yuiconfig.options.outdir %>'
            src: [
                '**/*.html'
                '!**/*-src.html'
            ]
            dest: '<%= pkg.yuiconfig.options.outdir %>'
        ]

    api_dojo:
        options:
            patterns: [json: '<%= pkg.yuiconfig.options.exlinks.dojo %>']
            prefix: 'href="'
            preservePrefix: true
            preserveOrder: false

        files: [
            expand: true
            cwd: '<%= pkg.yuiconfig.options.outdir %>'
            src: [
                '**/*.html'
                '!**/*-src.html'
            ]
            dest: '<%= pkg.yuiconfig.options.outdir %>'
        ]