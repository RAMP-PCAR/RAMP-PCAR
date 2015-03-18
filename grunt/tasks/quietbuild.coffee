module.exports = (grunt) -> 
    grunt.registerTask(
        'quietbuild'
        'Run build without jscs.'
        [
            'clean:build'
            'copy:build'
            'assemble'
            'notify:page'
            'js:quietbuild'
            'css:build'
            'notify:build'
        ]
    )   