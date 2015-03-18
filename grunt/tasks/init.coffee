module.exports = (grunt) -> 
    grunt.registerTask(
        'init'
        'Only needed when the repo is first cloned. It\'s automatically run after \'npm install\''
        [
            'hub'
            'thanks'
            'api:enhance'
        ]
    )