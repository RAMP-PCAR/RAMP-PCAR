module.exports = (grunt)->

    knife = require('./../knife')

    grunt.registerTask(
        'js:prep'
        'INTERNAL: Prepares the list of JS files for concatenation.'
        ->
            grunt.config(
                'concat.jsLib.src'
                knife.smartExpand(
                    'lib/'
                    grunt.config 'pkg.ramp.concat.jsLib'
                    [
                        'src/js/lib/jquery.dataTables.pagination.ramp.js'
                        'src/js/lib/jquery.ui.navigation.ramp.js'
                        'src/js/lib/jscolor.js'
                        'src/js/RAMP/RAMP-starter.js'
                    ]
                )
            )

            #console.log(grunt.config('concat.jsLib'))
    )

    grunt.registerTask(
        'js:build'
        'INTERNAL: Concatenates, processes and copies all JS to the build folder.'
        [
            'hint'
            'jsstyle'
            'concat:jsLib'
            'copy:jsCore'
            'copy:jsPlugins'
            'replace:jsCoreBuild'
            'notify:js'               
        ]        
    )

    grunt.registerTask(
        'js:quietbuild'
        'INTERNAL: Concatenates, processes and copies all JS to the build folder.'
        ()->
            grunt.config(
                'concat.jsLib.src'
                knife.smartExpand(
                    'lib/'
                    grunt.config 'pkg.ramp.concat.jsLib'
                    [
                        'src/js/lib/jquery.dataTables.pagination.ramp.js'
                        'src/js/lib/jquery.ui.navigation.ramp.js'
                        'src/js/lib/jscolor.js'
                        'src/js/RAMP/RAMP-starter.js'
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

    grunt.registerTask(
        'js:dist'
        'INTERNAL: Minifies JS code.'
        [
            'uglify'
            'replace:jsCoreDist'
        ]
    )