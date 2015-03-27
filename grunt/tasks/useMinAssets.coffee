module.exports = (grunt) -> 
    grunt.registerTask(
        'useMinAssets'
        'Replace unmin WET references with the min paths for HTML files.'
        () ->
            htmlFiles = grunt.file.expand(
                [ 'dist/**/*.html', 'dist/js/lib/lib.min.js' ]
            )

            htmlFiles.forEach(
                ( file ) ->

                    contents = grunt.file.read file 
                    #contents = contents.replace( /\/unmin/g, "" )
                    contents = contents.replace 'js/lib/lib.js', 'js/lib/lib.min.js'
                    contents = contents.replace 'css/lib/lib.css', 'css/lib/lib.min.css'
                    contents = contents.replace 'css/theme.less.css', 'css/theme.less.min.css'
                    contents = contents.replace(/((?=\/wet-boew\/)[^\"]+?\.)(js|css)/g, '$1min.$2')

                    grunt.file.write file, contents 
            )
    )