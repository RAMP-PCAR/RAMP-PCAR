module.exports = (grunt) -> 
    
    grunt.registerTask(
        'serve:build'
        'Creates an unminified development package, starts a node server the specified port, watches for modified JS, CSS and other files, and reloads HTML page on change.'
        [
            'build'
            'connect:build'
            'watch'
        ]
    )

    grunt.registerTask(
        'serve:dist'
        'Creates a minified distribution package and starts a node server on the specified port.'
        [
            'dist'
            'connect:dist'
        ]
    )

    grunt.registerTask(
        'serve:qbuild'
        'A nice quiet build to test stuff without JSCS complaining on every keypress.'
        [
            'quietbuild'
            'connect:build'
            'watch'
        ]
    )