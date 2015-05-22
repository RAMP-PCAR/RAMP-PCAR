module.exports = (grunt) -> 
    grunt.registerTask(
        'release'
        'INTERNAL Uploads release builds to GitHub releases.'
        () ->
            tasks = [
                'copy:tarballDist' # copy tarballs into a separate folder
                'gh-pages:travis' # drop build files to our dist GitHub repo
                
                'gh-pages-clean' # clean module cache
                
                'copy:demo' # crete a demo folder
                'gh-pages:demo' # push demo to RAMPDocs site
            ]
            
            if process.env.TRAVIS_TAG ##&& (process.env.TRAVIS_BRANCH == 'develop' || process.env.TRAVIS_BRANCH == 'master')  ?
                
                if process.env.TRAVIS_TAG.match /^v\d+\.\d+\.\d+(-rc.+)?$/ # match only proper releases and release candidates
                    tasks.push 'github-release' # upload build files to GitHub release only 
                    grunt.config 'github-release.options.release.body', 'Release Candidate'

                if process.env.TRAVIS_TAG.match /^v\d+\.\d+\.\d+$/
                    grunt.config 'github-release.options.release.body', 
                        '* [' + process.env.TRAVIS_TAG + ' release notes](http://ramp-pcar.github.io/versions/' + process.env.TRAVIS_TAG + '-en.html) <br>' + 
                        '* [Live Demo](http://ramp-pcar.github.io/demos/NRSTC/' + process.env.TRAVIS_TAG + '/' +  grunt.config("pkg.name") + '/ramp-en.html)'
                
                    # generate new api only for majour releases
                    tasks.push( 
                        'api' # generate new api
                        'copy:api' # create a folder for a new api
                        'gh-pages:api' # push api docs to RAMP Docs site
                    )

                grunt.task.run tasks
    )