module.exports = 
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