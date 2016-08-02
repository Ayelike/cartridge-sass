/*eslint-env node, mocha */
'use strict';

var path   = require('path');
var fs     = require('fs-extra');
var chai   = require('chai');
var expect = chai.expect;

chai.use(require('chai-fs'));
chai.should();

var MOCK_PROJECT_DIR = path.join(process.cwd(), 'test', 'mock-project');
var STYLE_SRC_DIR    = path.join(MOCK_PROJECT_DIR, '_source', 'styles');
var STYLE_DEST_DIR   = path.join(MOCK_PROJECT_DIR, 'public', '_client', 'styles');

var MAIN_SCSS_FILEPATH          = path.join(STYLE_SRC_DIR, 'main.scss');
var MAIN_CSS_FILEPATH           = path.join(STYLE_DEST_DIR, 'main.css');
var MAIN_CSS_SOURCEMAP_FILEPATH = path.join(STYLE_DEST_DIR, 'main.css.map');

process.chdir(MOCK_PROJECT_DIR);

var gulprunner = require(path.resolve(process.cwd(), 'gulprunner.js'));

function cleanUp() {
	fs.remove(MAIN_SCSS_FILEPATH);
	fs.remove(MAIN_CSS_FILEPATH);
	fs.remove(MAIN_CSS_SOURCEMAP_FILEPATH);
}

function assertGoldMaster(master) {
	var goldMasterPath = path.resolve(path.join('../', 'gold-master', master));
	var goldMaster     = fs.readFileSync(goldMasterPath, {encoding: 'utf8'});
	var generated      = fs.readFileSync(MAIN_CSS_FILEPATH, {encoding: 'utf8'});

	expect(goldMaster).to.equal(generated);
}

describe('As a gulpfile', function asAGulpfile() {
	describe('when a task is included', function whenATaskIsIncluded() {
		var basicrunner;

		before(function beforeTests(done) {
			basicrunner = require(path.resolve(process.cwd(), 'basicrunner.js'));

			done();
		});

		it('should add one task to the default group', function shouldAddOneTaskToDefaultGroup() {
			expect(basicrunner.tasks.default.length).to.equal(1);
		});

		it('should add the sass task to the default group', function shouldAddSassTaskToDefaultGroup() {
			expect(basicrunner.tasks.default[0]).to.equal('sass');
		});

		it('should add one task to the watch group', function shouldAddOneTaskToWatchGroup() {
			expect(basicrunner.tasks.watch.length).to.equal(1);
		});

		it('should add the watch:sass task to the watch group', function shouldAddWatchTaskToGroup() {
			expect(basicrunner.tasks.watch[0]).to.equal('watch:sass');
		});

		it('should add one clean path to the clean config', function shouldAddOneCleanPathToCleanConfig() {
			expect(basicrunner.config.cleanPaths.length).to.equal(1);
		});

		it('should add the generated styles path to the clean config', function shouldAddGeneratedStylesPathToCleanConfig() {
			var relative = path.relative(process.cwd(), basicrunner.config.cleanPaths[0]);
			expect(relative).to.equal(path.join('public', '_client', 'styles'));
		});
	});
})

describe('As a user of the cartridge-sass module', function AsCartridgeSassUser() {

	this.timeout(10000);

	describe('when `gulp sass` is run WITHOUT production flag', function whenRunWithoutProdFlag() {

		before(function beforeTests(done) {
			gulprunner.setDev();
			gulprunner.run(done);
		});

		after(function afterTests() {
			cleanUp();
		});

		it('should generate the main.scss file in the _source dir', function shouldGenerateMainScssFile() {
			expect(MAIN_SCSS_FILEPATH).to.be.a.file();
		});

		it('should add the main.css file to the public styles folder', function shouldAddFileToPublic() {
			expect(MAIN_CSS_FILEPATH).to.be.a.file();
		});

		it('should add the main.css.map sourcemap file to the public styles folder', function shouldAddSourcemapToPublic() {
			expect(MAIN_CSS_SOURCEMAP_FILEPATH).to.be.a.file();
		});

		it('should generate the correct css', function shouldGenerateTheCorrectCss() {
			assertGoldMaster('dev.css');
		});

	});

	describe('when `gulp sass` is run WITH production flag', function whenRunWithProdFLag() {

		before(function beforeTests(done) {
			gulprunner.setProd();
			gulprunner.run(done);
		});

		after(function afterTests() {
			cleanUp();
		});

		it('should generate the main.scss file in the _source dir', function shouldGenerateMainScssFile() {
			expect(MAIN_SCSS_FILEPATH).to.be.a.file();
		});

		it('should add the main.css file to the public styles folder', function shouldAddFileToPublic() {
			expect(MAIN_CSS_FILEPATH).to.be.a.file();
		});

		// Disabled pending this issue being resolved: https://github.com/chaijs/chai-fs/issues/9
		// .not.to.be.a.file(); ALWAYS returns TRUE
		it('should not add the main.css.map sourcemap file to the public styles folder', function shouldNotAddSourcemapToPublic() {
			expect(MAIN_CSS_SOURCEMAP_FILEPATH).to.not.be.a.path();
		});

		it('should generate the correct css', function shouldGenerateTheCorrectCss() {
			assertGoldMaster('prod.css');
		});

	});

});
