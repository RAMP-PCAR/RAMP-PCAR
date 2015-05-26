module.exports = (grunt)->

    knife = require('./../knife')

    grunt.registerTask(
        'css:build'
        'INTERNAL: Concatenates, processes and copies all CSS to the build folder.'
        ()->
            pkg = grunt.option 'pkg'

            grunt.config(
                'concat.cssLib.src'
                knife.smartExpand(
                    'lib/'
                    # get the list of things to concatenate from core package data
                    pkg.core.ramp.concat.cssLib
                )
            )

            grunt.task.run [
                'less'
                'autoprefixer'
                'concat:cssLib'
                'copy:cssLibResBuild'
                'notify:css'
            ]
    )