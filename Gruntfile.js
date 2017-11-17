module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      watch: {
        scripts: {
          files: ['redditfeud/src/*.js'],
          tasks: ['jshint'],
        },
      },
      uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'redditfeud/scripts/script.min.js': ['<%= concat.build.dest %>']
        }
      }
    },
    qunit: {
      files: ['redditfeud/test/*.html']
    },
    jshint: {
      files: ['Gruntfile.js', 'redditfeud/src/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
        concat: {
            "options": { "separator": ";" },
            "build": {
                "src": ["redditfeud/src/*.js"],
                "dest": "redditfeud/scripts/script.js"
            },
        },
    });

    // Load required modules
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Task definitions
    grunt.registerTask('default', ['concat', 'jshint', 'uglify', 'qunit']);
};
