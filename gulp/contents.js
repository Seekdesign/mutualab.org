const 
           gulp = require('gulp'),
           glob = require("glob"),
             fs = require('fs'),
      camelCase = require('camel-case'),
           path = require('path'),
         marked = require('marked'),
            ejs = require('ejs'),
        gulpEjs = require('gulp-ejs'),  
       beautify = require('gulp-jsbeautifier'),
        plumber = require('gulp-plumber'),
   autoprefixer = require("gulp-autoprefixer"),
          gutil = require('gulp-util');

module.exports = (config, bsync) => () => {

    var contentJsonFiles = glob.sync(`${config.contDir}/*.json`),
         componentsFiles = glob.sync(`${config.srcDir}/render/components/*{.ejs,.html}`),
          contentMdFiles = glob.sync(`${config.contDir}/*.md`),
              viewsFiles = glob.sync(`${config.srcDir}/render/views/*{.ejs,.html}`),
                    data = {"views":{},"components":{},"contents":{}};

    function getName(file){
      var ext = path.extname(file);
      var key = path.basename(file, ext);
      return camelCase(key)
    }

    contentJsonFiles.forEach((file) => {
      var rawContent = fs.readFileSync(file,'utf-8');
      content = JSON.parse(rawContent);
      data[getName(file)]=content;
    });

    componentsFiles.forEach((file) => {
      data.components[getName(file)] = ejs.compile(fs.readFileSync(file,'utf-8'), {});
    })

    contentMdFiles.forEach((file) => {
        var rawContent = fs.readFileSync(file,'utf-8');

        tmpData = {
          data:data,
          components:data.components
        };

        markdownHtml =  marked(rawContent);

        // allow components in markdown contents
        markdownHtml = markdownHtml.replace(/\<p\>\[\%(.*)\%\]<\/p\>/g, "<%- (typeof $1 == 'function' ? $1(data) : $1) %>");
        data.contents[getName(file)] = ejs.render(markdownHtml, tmpData, {} )
    });

    viewsFiles.forEach((file) => {
      data.views[getName(file)] = ejs.compile(fs.readFileSync(file,'utf-8'), {client:true});
    })

    return gulp.src(`${config.srcDir}/render/**/*.ejs`)
      .pipe(plumber())
      .pipe(gulpEjs(data,{ext:'.html'}).on('error', gutil.log))
      .pipe(beautify({indentSize: 2}))
      .pipe(gulp.dest(`./${config.tmpDir}`))
      .pipe(bsync.stream());

};