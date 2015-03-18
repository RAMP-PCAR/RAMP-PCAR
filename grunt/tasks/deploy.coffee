module.exports = (grunt) -> 
    grunt.registerTask(
        'deploy'
        'Deploys a dist into the specified folder.'
        [
            'dist'
            'clean:deploy'
            'copy:deploy'
            'notify:deploy'
        ]
    )  