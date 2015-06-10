module.exports = (grunt)->

    grunt.registerTask(
        'nfp:file'
        'INTERNAL: Adds a production warning by creating an empty file with a corresponding name in the build folder.'
        ->
            grunt.file.write 'build/NOT_FOR_PRODUCTION', 'use dist \'folder\' instead'
    )