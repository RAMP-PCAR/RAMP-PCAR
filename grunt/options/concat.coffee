module.exports = 
    options:
        # remove //@ style sourcemaps
        process: (src, filepath) ->
            src.replace( /\/\/@.*$/mg, '' )
        stripBanners: false
        separator: '/* */ \n\r /* */'

    jsLib:
        dest: 'build/js/lib/lib.js'

    cssLib:
        dest: 'build/css/lib/lib.css'