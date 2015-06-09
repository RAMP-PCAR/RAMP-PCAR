module.exports = (grunt) -> 
    
    grunt.registerTask(
        'assembleConfigs'
        'INTERNAL'
        () ->
            # get RAMP core package to get language info
            pkg = grunt.option 'pkg'

            languages = pkg.core.ramp.locale.languages
            tasks = []
            
            languages.forEach(
                ( lang ) ->
                    json = grunt.file.readJSON 'build/locales/' + lang + '-CA/translation.json'
                    
                    grunt.config 'replace.config-' + lang,
                        options:
                            patterns: [
                                json: json
                            ]
                        files: [
                            src: 'build/config.json'
                            dest: 'build/config.' + lang + '.json'
                        ]
                        
                    tasks.push 'replace:config-' + lang
            )       
            
            tasks.push 'notify:configGenerated'
            
            #console.log grunt.config 'replace'
            #console.log tasks
            grunt.task.run tasks
    )