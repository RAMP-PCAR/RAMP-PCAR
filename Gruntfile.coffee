
module.exports = (grunt) ->

	@registerTask(
		'build'
		'Run full build.'
		[
			'clean:build'
			'copy:wetboewBuild'
			'copy:assetsBuild'
			'assemble'
		]
	)

	@registerTask(
		'dist'
		'Produces the production files'
		[
			'clean:dist'
			'copy:wetboewDist'
			'copy:assetsDist'
			'build'
			'htmlmin'
			'useMinAssets'
			'imagemin'
		]
	)

	@registerTask(
		"serve:build"
		"INTERNAL: Create unminified docs"
		[
			'build'
			'connect:build'
			'watch'
		]
	)

	@registerTask(
		"serve:dist"
		"INTERNAL: Create unminified docs"
		[
			'dist'
			'connect:dist'
		]
	)

	@registerTask(
		"useMinAssets"
		"Replace unmin WET refrences with the min paths for HTML files"
		() ->
			htmlFiles = grunt.file.expand(
				'dist/**/*.html'
			);

			htmlFiles.forEach(
				( file ) ->
					contents = grunt.file.read( file )
					#contents = contents.replace( /\/unmin/g, "" )
					contents = contents.replace( /((?=\/wet-boew\/)[^\"]+?\.)(js|css)/g, "$1min.$2" )

					grunt.file.write(file, contents);
			);
	)

	grunt.util.linefeed = "\n"
	# Project configuration.
	grunt.initConfig

		# Metadata.
		pkg: grunt.file.readJSON("package.json")

		copy:
			wetboewBuild:
				expand: true
				cwd: "lib/wet-boew/dist/unmin"
				src: [
					"**/*.*"
					"!ajax/**/*.*"
					"!**/logo.*"
					"!**/favicon*.*"
					"!demos/**/*.*"
					"!docs/**/*.*"
					"!test/**/*.*"
					"!theme/**/*.*"					
					"!*.html"
				]
				dest: "build/js/lib/wet-boew/"

			wetboewDist:
				expand: true
				cwd: "lib/wet-boew/dist"
				src: [
					"**/*.*"
					"!ajax/**/*.*"
					"!**/logo.*"
					"!**/favicon*.*"
					"!demos/**/*.*"
					"!docs/**/*.*"
					"!test/**/*.*"
					"!theme/**/*.*"
					"!unmin/**/*.*"
					"!*.html"
				]
				dest: "dist/js/lib/wet-boew/"

			assetsBuild:
				expand: true
				cwd: "src/assets"
				src: "**/*.*"
				dest: "build/assets"

			assetsDist:
				expand: true
				cwd: "src/assets"
				src: "**/*.*"
				dest: "dist/assets"

		assemble:
			options:
				data: [
					"lib/wet-boew/site/data/**/*.{yml,json}"
					"site/data/**/*.{yml,json}"
				]
				helpers: [
					"lib/wet-boew/site/helpers/helper-*.js"
					"site/helpers/helper-*.js"
				]
				partials: [
					"lib/wet-boew/site/includes/**/*.hbs"
					"site/includes/**/*.hbs",
				]
				layoutdir: "site/layouts"
				layout: "default.hbs"

				i18next:
					countryCode: 'CA'
					debug: false
					localePath: 'src/locales'
					languages: ['en', 'fr']

			ramp:
				options:
					assets: 'js/lib/wet-boew'
					rampAssets: 'assets'
					
					environment:
						jqueryVersion: "2.1.1"
						#jqueryVersion: "<%= jqueryVersion.version %>"
						#jqueryOldIEVersion: "<%= jqueryOldIEVersion.version %>"
					flatten: true
					plugins: ["assemble-contrib-i18n"]
					i18n:
						languages: ['en', 'fr']
						templates: [
							'site/pages/ramp.hbs'
						]
				dest: "build/"
				src: "!*.*"

			ajax:
				options:
					flatten: true
					plugins: ["assemble-contrib-i18n"]
					i18n:
						languages: ['en', 'fr']
						templates: [
							'site/pages/ajax/*.hbs'
						]
				dest: "build/ajax/"
				src: "!*.*"

		htmlmin:
			options:
				collapseWhitespace: true
				preserveLineBreaks: true
				removeAttributeQuotes: false
			all:
				cwd: 'build'
				src: [
					"**/*.html"
				]
				dest: 'dist'
				expand: true

		imagemin:
			all:
				cwd: "dist/assets"
				src: ['**/*.{png,jpg,gif}']
				dest: "dist/assets"
				expand: true

		connect:
			#options:
				#port: 3002

			build:
				options:
					base: 'build'
					port: 3002
					livereload: true

			dist:
				options:
					base: 'dist'
					port: 3002
					livereload: true
					keepalive: true

		watch:
			pages:
				files: [
					'site/**/*.hbs'
				]
				tasks: [
					#'build'
					'assemble' #for quicker build only run a subset of build
				]

			jS:
				files: [
					'src/js/**/*.js'
				]
				tasks: [
					#'build'
					'assemble' #for quicker build only run a subset of build
				]

		clean:
			build:[
				'build'
			]
			dist: [
				'dist'
			]

	# These plugins provide necessary tasks.
	@loadNpmTasks "assemble"
	@loadNpmTasks "grunt-newer"
	@loadNpmTasks "grunt-contrib-copy"
	@loadNpmTasks "grunt-contrib-connect"
	@loadNpmTasks "grunt-contrib-watch"
	@loadNpmTasks "grunt-contrib-clean"
	@loadNpmTasks "grunt-contrib-htmlmin"
	@loadNpmTasks "grunt-contrib-imagemin"
	
	require( "time-grunt" )( grunt )
	@