module.exports = (grunt) -> 
    grunt.registerTask(
        'hint'
        'INTERNAL: Runs JSHint on JS code.'
        [
            'jshint'
            'notify:hint'
        ]
    )