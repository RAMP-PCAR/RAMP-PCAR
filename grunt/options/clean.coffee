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
        '<%= pkg.yuiconfig.options.outdir %>'
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

    oneConfig: [
        'build/config.json'
    ]