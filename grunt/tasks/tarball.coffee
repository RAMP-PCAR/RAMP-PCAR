module.exports = (grunt) -> 
    grunt.registerTask(
        'tarball'
        'INTERNAL: Creates a tarball of the distribution package.'
        [
            'clean:tarball'
            'compress'
            'notify:tarball'
        ]
    )  