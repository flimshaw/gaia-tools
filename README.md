# gaia-tools

These are a few scripts/docker containers I used to process the Gaia dataset. Hopefully they will be a useful reference, but aren't really something I'll necessarily be maintaining for public use. Please feel free to contact me if you're using this code for your own project and have questions. I'm on twitter @flimshaw.

## gaiaDataExtractor

This tool downloads a gzipped CSV file from S3 storage, processes it, and uploads a new CSV back to S3.  In this case, it is calculating distances and positions for stars, but is a pretty handy universal pattern for working with datafiles on S3 of any sort.  It is meant to be used as a docker container and deployed in arbitrary numbers across a cluster of machines.

## gaiaFileRetriever

This is a real simple script that downloads a file from http and streams it back up to your own S3 bucket.

## gaiaBinFileCreator

This queries a local sqlite3 database and streams binary data from it to a local file.
