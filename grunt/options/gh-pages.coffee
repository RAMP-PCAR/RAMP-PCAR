module.exports = 
    #options:
        # clone: 'ramp-pcar-dist'
        # base: 'dist'

    # push minified and unminified builds to the dist repo
    travis:
        options:
            clone: 'ramp-pcar-dist'
            repo: process.env.DIST_REPO
            branch: 'test' + '<%= pkg.series %>'
            message: ((
                if process.env.TRAVIS_TAG
                    "Production files for the " + process.env.TRAVIS_TAG + " release"
                else
                    "Travis build " + process.env.TRAVIS_BUILD_NUMBER + " [" + process.env.TRAVIS_BRANCH + "]"
            ))
            silent: true
            tag: ((
                if process.env.TRAVIS_TAG then process.env.TRAVIS_TAG else false
            ))
        src: [
            'tarball/*.zip'
        ]
        
    # push demo to the ramp docs repo to a related folder (ramp-pcar or ramp-theme-*)
    demo:
        options:
            add: true
            clone: 'ramp-pcar-demo'
            repo: process.env.DOCS_REPO
            branch: 'master'
            #base: 'demos/NRSTC'
            message: ((
                if process.env.TRAVIS_TAG
                    process.env.TRAVIS_TAG + " release demo"
                else
                    process.env.TRAVIS_BUILD_NUMBER + " [" + process.env.TRAVIS_BRANCH + "] build demo"
            ))
            silent: true
        src: [
            'demos/**/*.*'
        ]