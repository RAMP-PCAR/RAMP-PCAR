module.exports = (grunt)->

    grunt.registerTask(
        'assemblePages'
        'INTERNAL'
        () ->
            pkg = grunt.option 'pkg'
            tasks = [
                'assemble:ramp'
                'assemble:ajaxCore'
            ]

            # if theme, we need to generate ajax pages from wet theme and ramp theme itself
            # right now ajax pages are used to load content into the mega menu at run time
            # we need to generate ajax pages from wet themes because they might have some specific content
            # think Canada.ca there - it has a standardized menu content that you MUST use.
            if pkg.isTheme

                tasks.push(
                    'assemble:ajaxWetTheme'
                    'assemble:ajaxTheme'
                )

            grunt.task.run tasks
    )