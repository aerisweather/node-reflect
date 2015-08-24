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

    it('should copy the file using sha1 as a checksum', function(done) {
        fsExtra.ensureDirSync(resultDir);
        reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), {hashMethod: 'sha1'}, function(err, result) {
            if(err) {
                assert.ok(false, err.message);
            }
            fileExistsSync(path.join(resultDir, 'loon.jpg'));
            done();
        })
    });

    it('should error because bad hash specified', function(done) {
        fsExtra.ensureDirSync(resultDir);
        reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), {hashMethod: 'nope'}, function(err, result) {
            if(err) {
                assert.equal(err.code, 'BADHASH');
                return done();
            }
            assert.ok(false, "Didn't throw DIFF error when using a known hash.");
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

	it('should NOT copy over an existing file (clobber off)', function(done) {
		fsExtra.copySync(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'));

		reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), function(err, result) {
			if(err) {
				assert.equal(err.code, 'EEXIST');
				return done();
			}
			assert.ok(false, "Didn't throw EEXIST error when trying to clobber a file!");
		});
	});

	it('should copy over an existing file (clobber on)', function(done) {
		fsExtra.copySync(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'));

		reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), {clobber: true}, function(err, result) {
			if(err) {
				assert.ok(false, err.message);
			}
			fileExistsSync(path.join(resultDir, 'loon.jpg'));
			done();
		});
	});

	it('should copy the file to a non-existent folder without a lock', function(done) {
		reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), {useLock: false}, function(err, result) {
			if(err) {
				assert.ok(false, err.message);
			}
			fileExistsSync(path.join(resultDir, 'loon.jpg'));
			done();
		});
	});

    it('should copy use a known hash and compare after copy', function(done) {
        reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), {srcHash: "a6921e11627e0c995546086e7865eacb"}, function(err, result) {
            if(err) {
                assert.ok(false, err.message);
            }
            fileExistsSync(path.join(resultDir, 'loon.jpg'));
            done();
        });
    });

    it('should copy use a known hash and compare after copy and fail', function(done) {
        reflectCopy.copy(path.join(fixturesDir, 'loon.jpg'), path.join(resultDir, 'loon.jpg'), {srcHash: "abc123"}, function(err, result) {
            if(err) {
                assert.equal(err.code, 'DIFF');
                return done();
            }
            assert.ok(false, "Didn't throw DIFF error when using a known hash.");
        });
    });
});

function fileExistsSync(filePath) {
	// Query the entry
	var stats = fsExtra.lstatSync(filePath);
	assert.ok(!stats.isDirectory() && stats.isFile(), "File " + filePath + " does not exist");
}