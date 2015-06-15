module.exports = (grunt)->

    grunt.registerTask(
        'nfp:file'
        'INTERNAL: Adds a production warning by creating an empty file with a corresponding name in the build folder.'
        ->
            grunt.file.write 'build/NOT_FOR_PRODUCTION', 'use dist \'folder\' instead'
    )

    grunt.registerTask(
        'nfp:release'
        'INTERNAL: Removes a production warning from a release build. It\' left in weekly and rc builds.'
        ->
            pkg = grunt.option 'pkg'

            if pkg.core.version.match /^\d+\.\d+\.\d+$/
                grunt.task.run 'replace:nfpDist'
    )