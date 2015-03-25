module.exports = (grunt)->

    ZSchema = require("z-schema")
    util = require('util')

    grunt.registerTask(
        'zs3'
        'INTERNAL: Config validation'
        ->
            validator = new ZSchema()
        
            config = grunt.file.readJSON 'src/config.json'
            schema = grunt.file.readJSON 'src/configSchema.json'
            draft4 = grunt.file.readJSON 'src/draft-04-schema.json'
        
            validator.setRemoteReference 'http://json-schema.org/draft-04/schema#', draft4
        
            if validator.validate config, schema 
                grunt.task.run 'notify:configValid'
            else
                grunt.task.run 'notify:configInvalid'
                # use inspector to get to the deeply buried properties
                console.log util.inspect(validator.getLastErrors(),
                        showHidden: false
                        depth: 10
                    )
                                     
                grunt.fail.warn 'Config validation failed!'
    )