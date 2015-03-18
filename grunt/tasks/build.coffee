module.exports = (grunt) -> 
    grunt.registerTask(
        'build'
        'Run full build to create an uminified development package.'
        [
            'clean:build'
            'copy:build'
            'assemble'
            'notify:page'
            'js:prep'
            'js:build'
            'css:build'
            'notify:build'
        ]
    )