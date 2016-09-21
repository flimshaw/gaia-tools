var AWS = require('aws-sdk'),
    fs = require('fs'),
    awsCredentialsPath = './aws.credentials.json',
    sqsQueueUrl = 'YOUR_QUEUE_URL_HERE',
    http = require('http'),
    sqs;

  // Load credentials from local json file
  AWS.config.loadFromPath(awsCredentialsPath);

  function retrieveFile(filename, callback) {
    var s3Stream = require('s3-upload-stream')(new AWS.S3());

    var upload = s3Stream.upload({
      "Bucket": "YOUR_BUCKET_NAME",
      "Key": filename
    });

    upload.on('error', function (error) {
      console.log(error);
    });

    upload.on('part', function (details) {
      callback();
    });

    // Pipe the incoming filestream through directly up to S3.
    http.get({
      hostname: 'cdn.gea.esac.esa.int',
      port: 80,
      path: `/Gaia/gaia_source/csv/${filename}`,
      agent: false  // create a new agent just for this one request
    }, (res) => {
      // Do stuff with response
      res.pipe(upload);
    });

  }

module.exports = retrieveFile;
