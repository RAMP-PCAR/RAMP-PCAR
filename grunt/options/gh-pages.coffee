module.exports = 
    options:
        clone: 'ramp-pcar-dist'
        # base: 'dist'

    travis:
        options:
            repo: process.env.DIST_REPO
            branch: '<%= pkg.series %>'
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
            'dist/**/*.*'
            'build/**/*.*'
            'tarball/**/*.*'
        ]