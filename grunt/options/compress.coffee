module.exports = 
    tgz:
        options:
            level: 9
            mode: 'tgz'
            archive: 'tarball/<%= pkg.name %>-dist-<%= pkg.version %>.tgz'
            pretty: true
        files: [
            expand: true
            src: '**/*'
            cwd: 'dist/'
        ]

    zip:
        options:
            mode: 'zip'
            archive: 'tarball/<%= pkg.name %>-dist-<%= pkg.version %>.zip',
            level: 9
            pretty: true
        files: [                    
            expand: true
            src: '**/*'
            cwd: 'dist/'
        ]