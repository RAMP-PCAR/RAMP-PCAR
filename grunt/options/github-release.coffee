module.exports = 
    
    options:
        repository: process.env.HOME_REPO
        auth:
            user: 'ramp-pcar-bot'
            password: process.env.GH_TOKEN
        release:
            draft: true
            prerelease: true
            tag_name: process.env.TRAVIS_TAG
    files:
        src: ['tarball/*dist*.*']