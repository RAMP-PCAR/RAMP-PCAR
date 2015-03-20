module.exports = (grunt) -> 
    grunt.registerTask(
        'release'
        'INTERNAL Uploads release builds to GitHub releases.'
        () ->
            tasks = [
                #'github-release' # upload build files to GitHub release
                #'gh-pages:travis' # drop build files to our dist GitHub repo
                #'gh-pages-clean' # clean module cache
                'copy:demo' # crete a demo folder
                'gh-pages:demo' # push demo to RAMPDocs site
            ]
        
            if process.env.TRAVIS_TAG ##&& (process.env.TRAVIS_BRANCH == 'develop' || process.env.TRAVIS_BRANCH == 'master')  ?
                
                if process.env.TRAVIS_TAG.match /^v\d+\.\d+\.\d+$/
                    grunt.config 'github-release.options.release.body', 
                        '* [' + process.env.TRAVIS_TAG + ' release notes](http://ramp-pcar.github.io/versions/' + process.env.TRAVIS_TAG + '-en.html) <br>' + 
                        '* [Live Demo](http://ramp-pcar.github.io/demos/NRSTC/' + process.env.TRAVIS_TAG + '/' +  grunt.config("pkg.name") + '/ramp-en.html)'
    
                if process.env.TRAVIS_TAG.match /^v\d+\.\d+\.\d+(-.+)$/
                    grunt.config 'github-release.options.release.body', 'Internal QC release'
    
                grunt.task.run tasks
    )