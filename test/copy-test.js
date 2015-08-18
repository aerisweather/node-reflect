var assert = require('assert'),
	fsExtra = require('fs-extra'),
	path = require('path'),
	reflectCopy = require('../index');

var fixturesDir = path.join(__dirname, 'fixtures');
var resultDir = path.join(__dirname, 'dest')
describe('copy', function() {

	beforeEach(function() {
		// runs before each test in this block
		fsExtra.removeSync(resultDir);
	});

	it('should copy the file to an existing folder', function(done) {
		fsExtra.ensureDirSync(resultDir);
		reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), function(err, result) {
			if(err) {
				assert.ok(false, err.message);
			}
			fileExistsSync(path.join(resultDir, 'loon.jpg'));
			done();
		})
	});

	it('should copy the file to an existing folder, no filename', function(done) {
		fsExtra.ensureDirSync(resultDir);
		reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), resultDir, function(err, result) {
			if(err) {
				assert.ok(false, err.message);
			}
			fileExistsSync(path.join(resultDir, 'loon.jpg'));
			done();
		})
	});

	it('should copy the file to a non-existent folder', function(done) {
		reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), function(err, result) {
			if(err) {
				assert.ok(false, err.message);
			}
			fileExistsSync(path.join(resultDir, 'loon.jpg'));
			done();
		});
	});
});

function fileExistsSync(filePath) {
	// Query the entry
	var stats = fsExtra.lstatSync(filePath);
	assert.ok(!stats.isDirectory() && stats.isFile(), "File " + filePath + " does not exist");
}