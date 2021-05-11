# Using Circuit Breaker (opossum)

- Start Date: 2021-05-11
- Target Major Version: [6.0.1](https://github.com/nodeshift/opossum)
- Reference Issues: (fill in existing related issues, if any)
- Implementation PR: (leave this empty)

## Summary

One of the big differences between in-memory calls and remote calls is that remote calls can fail, or hang without a response until some timeout limit is reached. What's worse if you have many callers on a unresponsive supplier, then you can run out of critical resources leading to cascading failures across multiple systems

The basic idea behind the circuit breaker is very simple. You wrap a protected function call in a circuit breaker object, which monitors for failures. Once the failures reach a certain threshold, the circuit breaker trips, and all further calls to the circuit breaker return with an error, without the protected call being made at all

## Basic example

Wrap those functions up in a `CircuitBreaker` and you have control over your destiny.

```javascript
const CircuitBreaker = require('opossum');

function asyncFunctionThatCouldFail(x, y) {
  return new Promise((resolve, reject) => {
    // Do something, maybe on the network or a disk
  });
}

const options = {
  timeout: 3000, // If our function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 30000, // After 30 seconds, try again.
};
const breaker = new CircuitBreaker(asyncFunctionThatCouldFail, options);

breaker.fire(x, y).then(console.log).catch(console.error);
```

You can also provide a fallback function that will be executed in the event of failure. To take some action when the fallback is performed, listen for the fallback event.

```javascript
const breaker = new CircuitBreaker(asyncFunctionThatCouldFail, options);
// if asyncFunctionThatCouldFail starts to fail, firing the breaker
// will trigger our fallback function
breaker.fallback(() => 'Sorry, out of service right now');
breaker.on('fallback', (result) => reportFallbackEvent(result));
```

[Hystrix Metrics](https://github.com/nodeshift/opossum-hystrix) for Opossum Circuit Breaker

Each chained command can also have a callback, which will be invoked when the command gets a reply:

```javascript
  const CircuitBreaker = require('opossum');
  const HystrixStats = require('opossum-hystrix');
  const express = require('express');

  const app = express();
  app.use('/hystrix.stream', hystrixStream);

  // create a couple of circuit breakers
  const c1 = new CircuitBreaker(someFunction);
  const c2 = new CircuitBreaker(someOtherfunction);

  // Provide them to the constructor
  const hystrixMetrics = new HystrixStats([c1, c2]);

  // Provide a Server Side Event stream of metrics data
  function hystrixStream (request, response) {
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
        });
      response.write('retry: 10000\n');
      response.write('event: connecttime\n');

      hystrixMetrics.getHystrixStream().pipe(response);
    };
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
