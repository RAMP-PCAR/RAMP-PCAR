module.exports = (grunt) -> 
    
    grunt.registerTask(
        'assembleConfigs'
        'INTERNAL'
        () ->
            languages = ['en', 'fr']
            tasks = []
            
            languages.forEach(
                ( lang ) ->
                    json = grunt.file.readJSON 'src/locales/' + lang + '-CA/translation.json'
                    
                    grunt.config 'replace.config-' + lang,
                        options:
                            patterns: [
                                json: json
                            ]
                        files: [
                            src: 'src/config.json'
                            dest: 'build/config.' + lang + '.json'
                        ]
                        
                    tasks.push 'replace:config-' + lang
            )       
            
            tasks.push 'notify:configGenerated'
            tasks.push 'jsonlint:generatedConfigs'
            tasks.push 'notify:generatedConfigsLint'
            
            #console.log grunt.config 'replace'
            #console.log tasks
            grunt.task.run tasks
    )