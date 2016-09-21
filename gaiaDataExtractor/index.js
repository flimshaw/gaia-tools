var AWS = require('aws-sdk'),
    awsCredentialsPath = './aws.credentials.json',
    sqsQueueUrl = 'YOUR_QUEUE_URL_HERE',
    processor = require('./gaiaGetSourceData'),
    sqs


AWS.config.loadFromPath(awsCredentialsPath);

sqs = new AWS.SQS();

function IsJsonString(str) {
  try {
    JSON.parse(str)
    return true
  } catch(e) {
    return false
  }
}

function wait() {
  sqs.receiveMessage({
     QueueUrl: sqsQueueUrl,
     MaxNumberOfMessages: 1, // how many messages do we wanna retrieve?
     VisibilityTimeout: 120, // seconds - how long we want a lock on this job
     WaitTimeSeconds: 10 // seconds - how long should we wait for a message?
   }, function(err, data) {
     // If there are any messages to get
     if (data.Messages) {

       var message = data.Messages[0];
       if(IsJsonString(message.Body)) {

         // Get the first message (should be the only one since we said to only get one above)
         var body = JSON.parse(message.Body);

         // Now this is where you'd do something with this message
        console.log(`Processing file ${body.file}...`);  // whatever you wanna do

        processor(body.file, () => {
          console.log(`${body.file} processed and uploaded.`);
          sqs.deleteMessage({ QueueUrl: sqsQueueUrl, ReceiptHandle: message.ReceiptHandle }, (err,data) => {
              if(err) { console.log(err) }
          });
        })

       } else {
         console.log("Invalid message, deleting.");
         sqs.deleteMessage({ QueueUrl: sqsQueueUrl, ReceiptHandle: message.ReceiptHandle }, (err,data) => {
             if(err) { console.log(err) }
         });
       }
     }

   });
}

wait();
