module.exports = do (grunt) -> 
    
    grunt.util.linefeed = "\n"

    # turn on hooks
    grunt.task.run 'notify_hooks'

    #on watch events configure jshint:all to only run on changed file
    grunt.event.on 'watch', (action, filepath) ->
        grunt.config 'jshint.files', filepath
        grunt.config 'jscs.main.files.src', filepath

        # update what the notify tell
        grunt.config 'notify.hint.options.title', filepath.replace(/^.*[\\\/]/, "")
        grunt.config 'notify.jscs.options.title', filepath.replace(/^.*[\\\/]/, "")

    require( 'time-grunt' )( grunt )