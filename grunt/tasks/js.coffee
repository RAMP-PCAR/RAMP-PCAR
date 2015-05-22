module.exports = (grunt)->

    knife = require('./../knife')

    grunt.registerTask(
        'js:prep'
        'INTERNAL: Prepares the list of JS files for concatenation.'
        ->
            pkg = grunt.option 'pkg'

            grunt.config(
                'concat.jsLib.src'
                knife.smartExpand(
                    'lib/'
                    # get the list of things to concatenate from core package data
                    pkg.core.ramp.concat.jsLib
                    [
                        pkg.core.path + 'src/js/lib/jquery.dataTables.pagination.ramp.js'
                        pkg.core.path + 'src/js/lib/jquery.ui.navigation.ramp.js'
                        pkg.core.path + 'src/js/lib/jscolor.js'
                        pkg.core.path + 'src/js/RAMP/RAMP-starter.js'
                    ]
                )
            )

            #console.log(grunt.config('concat.jsLib'))
    )

    grunt.registerTask(
        'js:quietbuild'
        'INTERNAL: Concatenates, processes and copies all JS to the build folder.'
        ()->
            pkg = grunt.option 'pkg'

            grunt.config(
                'concat.jsLib.src'
                knife.smartExpand(
                    'lib/'
                    # get the list of things to concatenate from core package data
                    pkg.core.ramp.concat.jsLib
                    [
                        pkg.core.path + 'src/js/lib/jquery.dataTables.pagination.ramp.js'
                        pkg.core.path + 'src/js/lib/jquery.ui.navigation.ramp.js'
                        pkg.core.path + 'src/js/lib/jscolor.js'
                        pkg.core.path + 'src/js/RAMP/RAMP-starter.js'
                    ]
                )
            )

            #console.log(grunt.config('concat.jsLib'))

            grunt.task.run [
                'hint'
                'concat:jsLib'
                'copy:jsCore'
                'copy:jsPlugins'
                'replace:jsCoreBuild'
                'notify:js'               
            ]        
    )

