module.exports = (grunt) -> 
    grunt.registerTask(
        'jsstyle'
        'INTERNAL: Runs JSStyle on JS code.'
        [
            'jscs'
            'notify:jsstyle'
        ]
    )