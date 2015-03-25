module.exports = 
    options:
        force: true
    
    build:[
        'build'
    ]

    dist: [
        'dist'
    ]

    tarball: [
        'tarball'
    ]

    yuidoc: [
        '<%= yuidocconfig.options.outdir %>'
    ]

    docco: [
    ]

    deploy:
        options:
            ##'no-write': true
            force: false
        
        src: [
            ##'<%= pkg.ramp.deployFolder %>'
        ]