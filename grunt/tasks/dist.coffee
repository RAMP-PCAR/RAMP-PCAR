module.exports = (grunt) -> 
    grunt.registerTask(
        'dist'
        'Create a minified distribution package.'
        [
            'clean:dist'
            'build'
            'copy:dist'
            'js:dist'
            'templatemin'
            'json-minify'
            'cssmin'
            'htmlmin'
            'useMinAssets'
            'imagemin'
            'notify:min'
            'tarball'
            'notify:dist'
        ]
    )