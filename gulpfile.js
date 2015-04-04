var gulp = require('gulp'),
    log = require('gulp-util').log;

var jade = require('gulp-jade'),
    stylus = require('gulp-stylus'),
    coffee = require('gulp-coffee');

var connect = require('gulp-connect');

gulp.task('media', function() {
  gulp.src('src/images/*')
    .pipe(gulp.dest('public/assets/images')) 
    .pipe(connect.reload())
});

gulp.task('templates', function() {
	var locs = {}; 

	gulp.src('src/*.jade')
    .pipe(jade({locals: locs}))
    .pipe(gulp.dest('public'))
    .pipe(connect.reload())
});

gulp.task('scripts', function() {
  gulp.src('src/**/*.js')
    .pipe(gulp.dest('public/assets/js'))

	gulp.src('src/coffee/*.coffee')
    .pipe(coffee({bare: true}).on('error', log))
    .pipe(gulp.dest('public/assets/js'))
    .pipe(connect.reload())
});

gulp.task('styles', function() {
    gulp.src('src/stylesheets/*.styl')
      .pipe(stylus())
      .pipe(gulp.dest('public/assets/css'))
      .pipe(connect.reload())
});

gulp.task('connect', function() {
  connect.server({
    root: 'public',
    livereload: true
  });
});

gulp.task('watch', function() {
	gulp.watch('src/**/*', ['build']);
});

gulp.task('build', ['media', 'templates', 'styles', 'scripts']);
gulp.task('default', ['build', 'connect', 'watch']);