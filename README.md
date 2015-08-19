reflect-copy
===================
A verified copy for Node.js, available across filesystems and networks.

Master Build Status: 
[![Build Status](https://travis-ci.org/aerisweather/node-reflect-copy.svg?branch=master)](https://travis-ci.org/aerisweather/node-reflect-copy)
[![Coverage Status](https://coveralls.io/repos/aerisweather/node-reflect-copy/badge.svg?branch=master&service=github)](https://coveralls.io/github/aerisweather/node-reflect-copy?branch=master)

## Quick Example

```javascript
var rCopy = require('reflect-copy').copy;

rCopy('/path/to/source', 'path/to/dest', {}, function(err, results) {
    console.log(results.source); //The source file's hash
    console.log(results.destination); //The destination file's hash
});
```
## Features
We needed a nice copy to clone files across file systems. File operations should be verifiable yet simple. Using checksums we can ensure a file has been copied correctly, in it's entirety. We use the module `fs-extra` (because it's awesome) as a base, then just wrap it with a nice checksum verification method.

* Pre and post checksum comparison
* Locking for file copies
* Copy to temp location first, move into position (useful for network transfers)
* Configuration for common options

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `clobber` | (boolean) | `false` | Whether to overwrite if this file exists. |
| `hash` | (string) | `'md5'` | Which hash to use for the checksum: 'md5' or 'sha1' |
| `stale` | (int, ms) | `30000` | Duration to wait for the lock file before it is deemed stale (in milliseconds) |
| `tmpSuffix` | (string) | `'.copy-tmp'` | Whether to overwrite if this file exists. |
| `useLock` | (boolean) | `true` | Should we use lock files to ensure we are the only reflect-copy writing to this location. |
| `wait` | (int, ms) | `10000` | How long to wait for a lock file before erroring (in milliseconds) |

## Roadmap

 1. Support folders with multiple files
 1. Create a copySync method
