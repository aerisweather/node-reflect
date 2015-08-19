var async = require('async'),
	crypto = require('crypto'),
	fsExtra = require('fs-extra'),
	lockFile = require('lockfile'),
	path = require('path');

function copy(source, destination, options, callback) {
	//Parse Args
	if (typeof options === 'function' && !callback) {
		callback = options;
		options = {}
	} else if (typeof options === 'function' || options instanceof RegExp) {
		//options = {filter: options}
		callback(new Error('This form of copy does not support multiple files yet...'));
	}
	options = getCopyOptions(options);
	callback = callback || function () {
		};

	async.waterfall([
			function (callback) {
				//Check destination
				fsExtra.lstat(destination, function (err, stats) {
					var dirName = path.dirname(destination);
					if (err) {
						//Destination doesn't exist.
						fsExtra.ensureDir(dirName, function (err) {
							options.destination = destination;
							return callback(err);
						});
					}
					else {
						if (stats.isDirectory()) {
							var baseName = path.basename(source);
							options.destination = path.join(destination, baseName);
						}
						else {
							options.destination = destination;
						}
						return callback(null);
					}
				});
			},
			function (callback) {
				//Lock file for copying, make sure no one else interrupts us.
				if (options.useLock) {
					var lockFilePath = options.destination + '.copy-lock';
					var lockFileOpts = {
						wait:  options.wait,
						stale: options.stale
					};
					lockFile.lock(lockFilePath, lockFileOpts, function (err) {
						if (err) {
							return callback(err);
						}
						return callback(null);
					});
				}
				else {
					return callback(null);
				}
			},
			function (callback) {
				//Get the source hash
				getFileHash(source, options.hash, callback);
			},
			function (sourceFileHash, callback) {
				//Copy to temp location
				options.tmpDestination = options.destination + options.tmpSuffix;
				fsExtra.copy(source, options.tmpDestination, options, function (err) {
					if (err) {
						return callback(err);
					}
					return callback(null, sourceFileHash);
				});
			},
			function (sourceFileHash, callback) {
				//Move into final position
				fsExtra.move(options.tmpDestination, options.destination, {clobber: options.clobber}, function (err) {
					if (err) {
						if(err.code === 'EEXIST') {
							err.message = 'File already exists at ' + options.destination + ' (EEXIST) and the option \'clobber\' was set to false';
						}
						return callback(err);
					}
					return callback(null, sourceFileHash);
				});
			},
			function (sourceFileHash, callback) {
				//Verify hash
				getFileHash(options.destination, options.hash, function (err, dstFileHash) {
					if (err) {
						return callback(err);
					}
					if (dstFileHash != sourceFileHash) {
						return callback(new Error("Copied file hashes don't match. Source: " + sourceFileHash + ", Destination: " + dstFileHash));
					}
					return callback(null, sourceFileHash, dstFileHash);
				});
			},
			function (sourceFileHash, dstFileHash, callback) {
				if (options.useLock) {
					//Remove our lock, we are done!
					var lockFilePath = options.destination + '.copy-lock';
					lockFile.unlock(lockFilePath, function (err) {
						if (err) {
							return callback(err);
						}
						return callback(null, sourceFileHash, dstFileHash);
					});
				}
				else {
					return callback(null, sourceFileHash, dstFileHash);
				}
			}
		],
		function (err, sourceFileHash, dstFileHash) {
			callback(err, {
				source:      sourceFileHash,
				destination: dstFileHash
			});
		});
}

function getCopyOptions(options) {
	var resultOpts = {};
	resultOpts.clobber = (options.clobber !== undefined) ? options.clobber : false;
	resultOpts.hash = options.hash || 'md5';
	resultOpts.stale = options.stale || 30000; //in ms
	resultOpts.tmpSuffix = options.tmpSuffix || '.copy-tmp';
	resultOpts.useLock = (options.useLock !== undefined) ? options.useLock : true;
	resultOpts.wait = options.wait || 10000; //in ms
	return resultOpts;
}

function getFileHash(path, hash, callback) {
	try {
		var cryptoHash = crypto.createHash(hash);
	}
	catch (err) {
		//Hash not supported
		return callback(err);
	}
	var hashHex = '';

	//Hash source
	var fileStream = fsExtra.ReadStream(path);
	fileStream.on('data', function (data) {
		cryptoHash.update(data);
	});
	fileStream.on('error', function (err) {
		return callback(err);
	});
	fileStream.on('end', function () {
		hashHex = cryptoHash.digest('hex');
		return callback(null, hashHex);
	});
}


module.exports = {
	copy: copy
};