# Using Redis (ioredis)

- Start Date: 2021-05-11
- Target Major Version: [4.27.2](https://github.com/luin/ioredis)
- Reference Issues: (fill in existing related issues, if any)
- Implementation PR: (leave this empty)

## Summary

Using ioredis: A robust, performance-focused and full-featured Redis client for Node.js.

## Basic example

```javascript
const Redis = require('ioredis');
const redis = new Redis(); // uses defaults unless given configuration object

// ioredis supports all Redis commands:
redis.set('foo', 'bar'); // returns promise which resolves to string, "OK"

// the format is: redis[SOME_REDIS_COMMAND_IN_LOWERCASE](ARGUMENTS_ARE_JOINED_INTO_COMMAND_STRING)
// the js: ` redis.set("mykey", "Hello") ` is equivalent to the cli: ` redis> SET mykey "Hello" `

// ioredis supports the node.js callback style
redis.get('foo', function (err, result) {
  if (err) {
    console.error(err);
  } else {
    console.log(result); // Promise resolves to "bar"
  }
});

// Or ioredis returns a promise if the last argument isn't a function
redis.get('foo').then(function (result) {
  console.log(result); // Prints "bar"
});

// Most responses are strings, or arrays of strings
redis.zadd('sortedSet', 1, 'one', 2, 'dos', 4, 'quatro', 3, 'three');
redis.zrange('sortedSet', 0, 2, 'WITHSCORES').then((res) => console.log(res)); // Promise resolves to ["one", "1", "dos", "2", "three", "3"] as if the command was ` redis> ZRANGE sortedSet 0 2 WITHSCORES `

// All arguments are passed directly to the redis server:
redis.set('key', 100, 'EX', 10);
```

Connect to Redis

The process function can also be run in a separate process. This has several advantages:

- The process is `sandboxed` so if it crashes it does not affect the worker.
- You can run blocking code without affecting the queue (jobs will not stall).
- Much better utilization of multi-core CPUs.
- Less connections to redis.

In order to use this feature just create a separate file with the processor:

```javascript
new Redis(); // Connect to 127.0.0.1:6379
new Redis(6380); // 127.0.0.1:6380
new Redis(6379, '192.168.1.1'); // 192.168.1.1:6379
new Redis('/tmp/redis.sock');
new Redis({
  port: 6379, // Redis port
  host: '127.0.0.1', // Redis host
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: 'auth',
  db: 0,
});
```

You can also specify connection options as a `redis:// URL` or `redis:// URL` when using TLS encryption:

```javascript
// Connect to 127.0.0.1:6380, db 4, using password "authpassword":
new Redis('redis://:authpassword@127.0.0.1:6380/4');

// Username can also be passed via URI.
// It's worth to noticing that for compatibility reasons `allowUsernameInURI`
// need to be provided, otherwise the username part will be ignored.
new Redis('redis://username:authpassword@127.0.0.1:6380/4?allowUsernameInURI=true');
```

Pub/Sub support

Redis provides several commands for developers to implement the `Publish–subscribe pattern`. There are two roles in this pattern: publisher and subscriber. Publishers are not programmed to send their messages to specific subscribers. Rather, published messages are characterized into channels, without knowledge of what (if any) subscribers there may be.

By leveraging Node.js built-in events module, ioredis makes pub/sub very straightforward to use. Below is a simple example that consists of two files, one is publisher.js that publishes messages to a channel, the other is subscriber.js that listens for messages on specific channels.

```javascript
// publisher.js

const Redis = require('ioredis');
const redis = new Redis();

setInterval(() => {
  const message = { foo: Math.random() };
  // Publish to my-channel-1 or my-channel-2 randomly.
  const channel = `my-channel-${1 + Math.round(Math.random())}`;

  // Message can be either a string or a buffer
  redis.publish(channel, JSON.stringify(message));
  console.log('Published %s to %s', message, channel);
}, 1000);
```

```javascript
// subscriber.js

const Redis = require('ioredis');
const redis = new Redis();

redis.subscribe('my-channel-1', 'my-channel-2', (err, count) => {
  if (err) {
    // Just like other commands, subscribe() can fail for some reasons,
    // ex network issues.
    console.error('Failed to subscribe: %s', err.message);
  } else {
    // `count` represents the number of channels this client are currently subscribed to.
    console.log(`Subscribed successfully! This client is currently subscribed to ${count} channels.`);
  }
});

redis.on('message', (channel, message) => {
  console.log(`Received ${message} from ${channel}`);
});

// There's also an event called 'messageBuffer', which is the same as 'message' except
// it returns buffers instead of strings.
// It's useful when the messages are binary data.
redis.on('messageBuffer', (channel, message) => {
  // Both `channel` and `message` are buffers.
  console.log(channel, message);
});
```

Streams

```javascript
const Redis = require('ioredis');
const redis = new Redis();

const processMessage = (message) => {
  console.log('Id: %s. Data: %O', message[0], message[1]);
};

async function listenForMessage(lastId = '$') {
  // `results` is an array, each element of which corresponds to a key.
  // Because we only listen to one key (mystream) here, `results` only contains
  // a single element. See more: https://redis.io/commands/xread#return-value
  const results = await redis.xread('block', 0, 'STREAMS', 'mystream', lastId);
  const [key, messages] = results[0]; // `key` equals to "mystream"

  messages.forEach(processMessage);

  // Pass the last id of the results to the next round.
  await listenForMessage(messages[messages.length - 1][0]);
}

listenForMessage();
```

Handle Binary Data

```javascript
redis.set('foo', Buffer.from('bar'));

redis.getBuffer('foo', (err, result) => {
  // result is a buffer.
});
```

Pipelining

```javascript
const pipeline = redis.pipeline();
pipeline.set('foo', 'bar');
pipeline.del('cc');
pipeline.exec((err, results) => {
  // `err` is always null, and `results` is an array of responses
  // corresponding to the sequence of queued commands.
  // Each response follows the format `[err, result]`.
});

// You can even chain the commands:
redis
  .pipeline()
  .set('foo', 'bar')
  .del('cc')
  .exec((err, results) => {});

// `exec` also returns a Promise:
const promise = redis.pipeline().set('foo', 'bar').get('foo').exec();
promise.then((result) => {
  // result === [[null, 'OK'], [null, 'bar']]
});
```

Each chained command can also have a callback, which will be invoked when the command gets a reply:

```javascript
redis
  .pipeline()
  .set('foo', 'bar')
  .get('foo', (err, result) => {
    // result === 'bar'
  })
  .exec((err, result) => {
    // result[1][1] === 'bar'
  });
```

In addition to adding commands to the `pipeline queue` individually, you can also pass an array of commands and arguments to the constructor:

```javascript
redis
  .pipeline([
    ['set', 'foo', 'bar'],
    ['get', 'foo'],
  ])
  .exec(() => {
    /* ... */
  });
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
