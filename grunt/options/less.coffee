module.exports = 
    cssCore:
        expand: true
        cwd: 'src/css/'
        src: '**/theme.less'
        dest: 'build/css/'
        rename: (dest, src) ->
                dest + src.replace('.less', '.less.css');