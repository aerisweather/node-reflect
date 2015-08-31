var async = require('async'),
    crypto = require('crypto'),
    fsExtra = require('fs-extra'),
    lockFile = require('lockfile'),
    path = require('path'),
    tar = require('tar-fs');

var MODE_FILE = 'file';
var MODE_DIRECTORY = 'directory';
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

    options.source = source;
    options.destination = destination;

    var mode;
    async.waterfall([
            function (callback) {
                //Look at the source, are we moving a file or a directory?
                fsExtra.lstat(source, function (err, stats) {
                    if (stats.isDirectory()) {
                        mode = MODE_DIRECTORY;
                        callback(null);
                    }
                    else if (stats.isFile()) {
                        mode = MODE_FILE;
                        callback(null);
                    }
                    else {
                        var sourceNotFound = new Error("Source file doesn't exist");
                        sourceNotFound.code = "EEXISTSRC"
                        callback(new Error("Source file doesn't exist"))
                    }
                });
            },
            function (callback) {
                //Check destination
                fsExtra.lstat(destination, function (err, stats) {
                    //[Keep this here, we need to make a decision based on an error right here.]
                    var dirName = destination;
                    if (mode === MODE_FILE) {
                        dirName = path.dirname(destination);
                    }
                    if (err) {
                        //Destination doesn't exist.
                        fsExtra.ensureDir(dirName, function (err) {
                            if(mode === MODE_DIRECTORY) {
                                var baseName = path.basename(source);
                                options.destination = path.join(destination, baseName);
                            }
                            else {
                                options.destination = destination;
                            }
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
                        wait: options.wait,
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
                if (!options.srcHash) {
                    if (mode === MODE_FILE) {
                        options.source = source;
                        getFileHash(source, options.hashMethod, callback);
                    }
                    else if (mode === MODE_DIRECTORY) {
                        options.source = source + ".tar";
                        options.destination += ".tar";
                        tar.pack(source).pipe(fsExtra.createWriteStream(options.source))
                            .on('finish', function () {
                                getFileHash(options.source, options.hashMethod, callback);
                            }
                        );

                    }
                }
                else {
                    callback(null, options.srcHash);
                }
            },
            function (sourceFileHash, callback) {
                //Copy to temp location
                options.tmpDestination = options.destination;
                options.tmpDestination += options.tmpSuffix;
                fsExtra.copy(options.source, options.tmpDestination, options, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    if(mode === MODE_DIRECTORY) {
                        fsExtra.remove(options.source, function(err) {
                            if(err) {
                                return callback(new Error("Couldn't remove temporary source (tar file generated when moving directories)"));
                            }
                            return callback(null, sourceFileHash);
                        })
                    }
                    else {
                        return callback(null, sourceFileHash);
                    }
                });
            },
            function (sourceFileHash, callback) {
                //Move into final position
                fsExtra.move(options.tmpDestination, options.destination, {clobber: options.clobber}, function (err) {
                    if (err) {
                        if (err.code === 'EEXIST') {
                            err.message = 'File already exists at ' + options.destination + ' (EEXIST) and the option \'clobber\' was set to false';
                        }
                        return callback(err);
                    }
                    return callback(null, sourceFileHash);
                });
            },
            function (sourceFileHash, callback) {
                //Verify hash
                getFileHash(options.destination, options.hashMethod, function (err, dstFileHash) {
                    if (err) {
                        return callback(err);
                    }
                    if (dstFileHash != sourceFileHash) {
                        var diffError = new Error("Copied file hashes don't match. Source: " + sourceFileHash + ", Destination: " + dstFileHash);
                        diffError.code = "DIFF";
                        return callback(diffError);
                    }

                    if (mode === MODE_DIRECTORY) {
                        var destWithoutTar = options.destination.substr(0, options.destination.length - 4);
                        fsExtra.createReadStream(options.destination).pipe(tar.extract(destWithoutTar))
                            .on('finish', function () {
                                fsExtra.remove(options.destination, function(err) {
                                    if(err) {
                                        return callback(new Error("Couldn't remove temporary destination (tar file generated when moving directories)"));
                                    }
                                    options.source = options.source.substr(0, options.source.length - 4);
                                    options.destination = options.destination.substr(0, options.destination.length - 4);
                                    return callback(null, sourceFileHash, dstFileHash);
                                })
                            });
                    }
                    else {
                        return callback(null, sourceFileHash, dstFileHash);
                    }
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
                source: sourceFileHash,
                destination: dstFileHash
            });
        });
}

function getCopyOptions(options) {
    var resultOpts = {};
    //Overwrite
    resultOpts.clobber = (options.clobber !== undefined) ? options.clobber : false;

    resultOpts.srcHash = options.srcHash;
    resultOpts.hashMethod = options.hashMethod || 'md5';

    resultOpts.tmpSuffix = options.tmpSuffix || '.copy-tmp';
    resultOpts.useLock = (options.useLock !== undefined) ? options.useLock : true;

    resultOpts.stale = options.stale || 30000; //in ms
    resultOpts.wait = options.wait || 10000; //in ms
    return resultOpts;
}

function getFileHash(path, hashMethod, callback) {
    try {
        var cryptoHash = crypto.createHash(hashMethod);
    }
    catch (err) {
        //hashMethod not supported
        err.code = "BADHASH";
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