path = require('path')

module.exports = (grunt) ->

    require('load-grunt-config') grunt,
        jitGrunt: 
            customTasksDir: path.join(process.cwd(), 'grunt/tasks')
            staticMappings:
                'notify_hooks': 'grunt-notify'
        configPath: [
            path.join(process.cwd(), 'grunt/options')
            path.join(process.cwd(), 'grunt_overrider/options')
        ]
    changelog:
            options:
                issueLink : (issueId) ->
                    return '['+ issueId + '](http://tfs.int.ec.gc.ca:8080/tfs/DC/RAMP/_workitems/edit/' + issueId + ')'
    require('./grunt/prep') ( grunt )

    @
