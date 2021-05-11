# Using Queue (Bull)

- Start Date: 2021-05-11
- Target Major Version: [3.22.4](https://openbase.com/js/bull)
- Reference Issues: (fill in existing related issues, if any)
- Implementation PR: (leave this empty)

## Summary

Using Bull

## Basic example

```javascript
var Queue = require('bull');

var videoQueue = new Queue('video transcoding', 'redis://127.0.0.1:6379');
var audioQueue = new Queue('audio transcoding', { redis: { port: 6379, host: '127.0.0.1', password: 'foobared' } }); // Specify Redis connection using object
var imageQueue = new Queue('image transcoding');
var pdfQueue = new Queue('pdf transcoding');

videoQueue.process(function (job, done) {
  // job.data contains the custom data passed when the job was created
  // job.id contains id of this job.

  // transcode video asynchronously and report progress
  job.progress(42);

  // call done when finished
  done();

  // or give a error if error
  done(new Error('error transcoding'));

  // or pass it a result
  done(null, { framerate: 29.5 /* etc... */ });

  // If the job throws an unhandled exception it is also handled correctly
  throw new Error('some unexpected error');
});

audioQueue.process(function (job, done) {
  // transcode audio asynchronously and report progress
  job.progress(42);

  // call done when finished
  done();

  // or give a error if error
  done(new Error('error transcoding'));

  // or pass it a result
  done(null, { samplerate: 48000 /* etc... */ });

  // If the job throws an unhandled exception it is also handled correctly
  throw new Error('some unexpected error');
});

imageQueue.process(function (job, done) {
  // transcode image asynchronously and report progress
  job.progress(42);

  // call done when finished
  done();

  // or give a error if error
  done(new Error('error transcoding'));

  // or pass it a result
  done(null, { width: 1280, height: 720 /* etc... */ });

  // If the job throws an unhandled exception it is also handled correctly
  throw new Error('some unexpected error');
});

pdfQueue.process(function (job) {
  // Processors can also return promises instead of using the done callback
  return pdfAsyncProcessor();
});

videoQueue.add({ video: 'http://example.com/video1.mov' });
audioQueue.add({ audio: 'http://example.com/audio1.mp3' });
imageQueue.add({ image: 'http://example.com/image1.tiff' });
```

Separate processes

The process function can also be run in a separate process. This has several advantages:

- The process is `sandboxed` so if it crashes it does not affect the worker.
- You can run blocking code without affecting the queue (jobs will not stall).
- Much better utilization of multi-core CPUs.
- Less connections to redis.

In order to use this feature just create a separate file with the processor:

```javascript
// processor.js
module.exports = function (job) {
  // Do some heavy work

  return Promise.resolve(result);
};
```

And define the processor like this:

```javascript
// Single process:
queue.process('/path/to/my/processor.js');

// You can use concurrency as well:
queue.process(5, '/path/to/my/processor.js');

// and named processors:
queue.process('my processor', 5, '/path/to/my/processor.js');
```

Repeated jobs

A job can be added to a queue and processed repeatedly according to a cron specification:

```javascript
paymentsQueue.process(function (job) {
  // Check payments
});

// Repeat payment job once every day at 3:15 (am)
paymentsQueue.add(paymentsData, { repeat: { cron: '15 3 * * *' } });
```

Events

A queue emits some useful events, for example...

```javascript
.on('completed', function(job, result){
  // Job completed with output result!
})
```

Cluster support

```javascript
var Queue = require('bull'),
  cluster = require('cluster');

var numWorkers = 8;
var queue = new Queue('test concurrent queue');

if (cluster.isMaster) {
  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('online', function (worker) {
    // Lets create a few jobs for the queue workers
    for (var i = 0; i < 500; i++) {
      queue.add({ foo: 'bar' });
    }
  });

  cluster.on('exit', function (worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });
} else {
  queue.process(function (job, jobDone) {
    console.log('Job done by worker', cluster.worker.id, job.id);
    jobDone();
  });
}
```

## Motivation

- High quality production Redis instances
- Redis-based queue for Node
- Monitoring, metrics and statistics.

## Adoption strategy

List all modules then discuss how to make them dependence.
Should make another branch and apply for every modules.

## Unresolved questions

Optional, but suggested for first drafts. What parts of the design are still
TBD?
