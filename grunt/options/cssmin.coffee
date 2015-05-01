module.exports = 
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