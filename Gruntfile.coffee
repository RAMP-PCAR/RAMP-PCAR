path = require('path')

module.exports = (grunt) ->

    require('load-grunt-config') grunt,
        jitGrunt: 
            customTasksDir: path.join(process.cwd(), 'grunt/tasks')
            staticMappings:
                'notify_hooks': 'grunt-notify'
                'changelog': 'grunt-conventional-changelog'
                'github-release': 'grunt-github-releaser'
                'htmllint': 'grunt-html'
        configPath: [
            path.join(process.cwd(), 'grunt/options')
            path.join(process.cwd(), 'grunt_overrider/options')
        ]

    require('./grunt/prep') ( grunt )

    @
