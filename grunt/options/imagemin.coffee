module.exports = 
    all:
        cwd: 'dist/assets'
        src: '**/*.{png,jpg,gif}'
        dest: 'dist/assets'
        expand: true