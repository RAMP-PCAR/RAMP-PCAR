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
        
    tgzunmin:
        options:
            level: 9
            mode: 'tgz'
            archive: 'tarball/<%= pkg.name %>-build-<%= pkg.version %>.tgz'
            pretty: true
        files: [
            expand: true
            src: '**/*'
            cwd: 'build/'
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
        
    zipunmin:
        options:
            mode: 'zip'
            archive: 'tarball/<%= pkg.name %>-build-<%= pkg.version %>.zip',
            level: 9
            pretty: true
        files: [                    
            expand: true
            src: '**/*'
            cwd: 'build/'
        ]