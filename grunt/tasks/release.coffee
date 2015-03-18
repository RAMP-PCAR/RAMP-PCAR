module.exports = (grunt) -> 
    grunt.registerTask(
        'release'
        'INTERNAL Uploads release builds to GitHub releases.'
        () ->
            tasks = [
                'github-release'
                'gh-pages'
            ]
        
            if process.env.TRAVIS_TAG ##&& (process.env.TRAVIS_BRANCH == 'develop' || process.env.TRAVIS_BRANCH == 'master') 
                
                if process.env.TRAVIS_TAG.match /^v\d+\.\d+\.\d+$/
                    grunt.config 'github-release.options.release.body', '* [' + process.env.TRAVIS_TAG + ' release notes](http://ramp-pcar.github.io/versions/' + process.env.TRAVIS_TAG + '-en.html)'
                
                grunt.task.run tasks
    )