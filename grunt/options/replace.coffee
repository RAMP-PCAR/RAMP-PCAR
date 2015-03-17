module.exports = 
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
            src: 'build/js/lib/lib.js'
            dest: 'build/js/lib/lib.js'
        ]

    jsCoreDist:
        options:
            patterns: [
                match: /$/
                replacement: '\nconsole.log(\"<%= pkg.ramp.rampASCII %>\");'
            ]
            usePrefix: false

        files: [
            src: 'dist/js/lib/lib.js'
            dest: 'dist/js/lib/lib.js'
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