# reflect-copy
===================

A verified copy for Node.js, available across filesystems and networks.

We needed a nice copy to clone files across file systems. File operations should be verifiable yet simple. Using checksums
we can ensure a file has been copied correctly, in it's entirety. We use the module `fs-extra`, because it's awesome, as a
base, then just wrap it with a nice checksum verification method.

## Roadmap

 1. Create a copySync method