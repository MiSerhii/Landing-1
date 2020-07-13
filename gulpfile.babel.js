// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
import { src, dest, watch, series, parallel } from 'gulp';
import render from 'gulp-nunjucks-render';

// Importing all the Gulp-related packages we want to use
import sourcemaps from 'gulp-sourcemaps';
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import imagemin from 'gulp-imagemin';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import glob from 'glob';
import flatten from 'gulp-flatten';
import concat from 'gulp-concat';

// Files paths
const paths = {
  dist: 'dist',
  styles: 'src/assets/styles',
  images: 'src/assets/images',
  fonts: 'src/assets/fonts',
  scripts: 'src/scripts',
  partials: 'src/views/partials',
  pages: 'src/views/pages',
}

// Files names
const files = {
  styles: `${paths.styles}/**/*.scss`,
  images: `${paths.images}/**/*.*`,
  fonts: `${paths.fonts}/**/*.*`,
  scripts: `${paths.scripts}/**/*.js`,
  partials: `${paths.partials}/**/*.html`,
  pages: `${paths.pages}/**/*.html`,
}

// Dist files paths
const dist = {
  styles: `${paths.dist}/css`,
  scripts: `${paths.dist}/js`,
  pages: `${paths.dist}/`,
  images: `${paths.dist}/images`,
  fonts: `${paths.dist}/css/fonts`,
};

const scss = () => (
  src(files.styles)
    .pipe(sourcemaps.init()) // initialize sourcemaps first
    .pipe(sass()) // compile SCSS to CSS
    .pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
    .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
    .pipe(dest(dist.styles)) // put final CSS in dist folder
);

const fonts = () => (
  src(files.fonts)
    .pipe(dest(dist.fonts))
);

const images = () => (
  src(files.images)
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }]
    }))
    .pipe(dest(dist.images))
);

const js = (done) => {
  glob(files.scripts, (error, files) => {
    if (error) { done(error) }

    files.map(entry => (
      browserify({ entries: [entry] })
        .transform(babelify, { presets: ['@babel/env'] })
        .bundle()
        .pipe(source(entry))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(flatten())
        // .pipe(sourcemaps.init({ loadMaps: true }))
        // .pipe(concat('bundle.js'))
        // .pipe(sourcemaps.write('.'))
        .pipe(dest(dist.scripts))
    ));

    done();
  })
};

const look = () => {
  watch([files.styles, files.scripts, files.pages, files.partials],
    parallel(scss, js, nunjucks));
}

const nunjucks = () => (
  src([files.pages])
    .pipe(render({
        path: [paths.partials]
      }))
    .pipe(dest(dist.pages))
);

exports.default = series(
  parallel(
    fonts,
    images,
    scss,
    js,
    nunjucks,
  ),
  look
);

exports.build = parallel(
  fonts,
  images,
  scss,
  js,
  nunjucks,
);

exports.render = nunjucks;
exports.js = js;
exports.img = images;
exports.fonts = fonts;
