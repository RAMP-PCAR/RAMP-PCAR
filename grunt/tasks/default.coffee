module.exports = (grunt) -> 
    grunt.registerTask(
        'default'
        'Default task create both an unminified development and a minified distribution packages.'
        [
            'dist'
        ]
    )