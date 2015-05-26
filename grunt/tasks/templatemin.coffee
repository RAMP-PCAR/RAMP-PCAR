module.exports = (grunt) -> 
    grunt.registerTask(
        'templatemin'
        'INTERNAL: Converts templates into (almost) proper JSON.'
        () ->
            templates = grunt.file.expand(
                'dist/js/RAMP/**/*.json'
            )

            templates.forEach(
                ( file ) ->

                    contents = grunt.file.read file
                    ## chaining functions fails; maybe it's related to the version of CoffeeScript Grunt uses
                    # strip comments
                    contents = contents.replace(/`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"|\/\*[^]*?\*\/|\/\/.*\n?/g,
                            (s) -> 
                                 if s.charAt(0) == '/' 
                                     return ''
                                  else 
                                     return s                                
                        )
                    # strip hard breaks and tabs
                    contents = contents.replace /[\n\r\t]/g, ''
                    # strip some of the white space
                    contents = contents.replace />\s*?</g, '><'

                    # strip spaces between html and other tags
                    contents
                        .replace(/%}\s*?</g, "%}<")
                        .replace(/>\s*?{%/g, ">{%")

                        .replace(/"\s*?</g, '"<')
                        .replace(/>\s*?"/g, '>"');

                    grunt.file.write file, contents
            )
    )