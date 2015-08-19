# reflect-copy
===================

Master Build Status: 
[![Build Status](https://travis-ci.org/aerisweather/node-reflect-copy.svg?branch=master)](https://travis-ci.org/aerisweather/node-reflect-copy)
[![Coverage Status](https://coveralls.io/repos/aerisweather/node-reflect-copy/badge.svg?branch=master&service=github)](https://coveralls.io/github/aerisweather/node-reflect-copy?branch=master)


A verified copy for Node.js, available across filesystems and networks.

We needed a nice copy to clone files across file systems. File operations should be verifiable yet simple. Using checksums
we can ensure a file has been copied correctly, in it's entirety. We use the module `fs-extra`, because it's awesome, as a
base, then just wrap it with a nice checksum verification method.

## Roadmap

 1. Create a copySync method