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
                    pkg.ramp.concat.cssLib
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