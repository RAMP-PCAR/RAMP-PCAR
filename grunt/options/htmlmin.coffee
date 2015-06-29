module.exports = 
    options:
        collapseWhitespace: true
        preserveLineBreaks: false
        removeAttributeQuotes: false
    all:
        cwd: 'build'
        src: '**/*.html'
        dest: 'dist'
        expand: true

    angularPartialsBuild:
        cwd: 'build'
        src: 'js/RAMP/Modules/partials/*.html'
        dest: 'build'
        expand: true