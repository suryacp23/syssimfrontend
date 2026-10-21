# Engine & Request Simulation Implementation Guide

# Goal

The engine is responsible for advancing **virtual time**, dispatching
events, routing requests, and coordinating simulation modules.

It must **not** contain business logic for Redis, Database, Queue, CPU,
etc.

------------------------------------------------------------------------

# Responsibilities

SimulationEngine

-   Own Virtual Clock
-   Own Event Queue
-   Register Nodes
-   Dispatch Events
-   Call Node.receive()
-   Route requests
-   Publish Metrics

Nodes

-   Process requests
-   Queue requests
-   Allocate workers
-   Forward requests

------------------------------------------------------------------------

# Folder Structure

``` text
simulation/
│
├── engine/
│   ├── SimulationEngine.ts
│   ├── EventQueue.ts
│   ├── VirtualClock.ts
│   ├── Router.ts
│   ├── NodeRegistry.ts
│   └── EventDispatcher.ts
│
├── request/
│   ├── SimRequest.ts
│   ├── RequestFactory.ts
│   ├── RequestGenerator.ts
│   ├── RequestLifecycle.ts
│   ├── RequestLogger.ts
│   └── RequestState.ts
```

------------------------------------------------------------------------

# Engine Components

## VirtualClock

Stores simulation time.

Methods

``` ts
now()

advance(delta)

reset()
```

No real Date object is used.

------------------------------------------------------------------------

## EventQueue

Priority Queue sorted by event.time.

Methods

``` ts
push(event)

pop()

peek()

isEmpty()
```

Implementation should be Min Heap.

------------------------------------------------------------------------

## NodeRegistry

``` ts
register(node)

get(id)

getAll()
```

Engine never imports ClientNode or RedisNode directly.

------------------------------------------------------------------------

## Router

Receives

``` text
Request

Current Node
```

Returns

``` text
Next Node
```

Routing strategies

-   Static
-   Round Robin
-   Least Connections
-   Random
-   Weighted

------------------------------------------------------------------------

## EventDispatcher

Consumes

``` text
NODE_RECEIVED
```

Calls

``` text
node.receive(request)
```

Consumes

``` text
NODE_COMPLETED
```

Calls

``` text
router.forward(request)
```

------------------------------------------------------------------------

# Engine Loop

``` text
tick()

↓

advance clock

↓

while(event.time <= clock)

↓

dispatch event

↓

node executes

↓

new events created

↓

repeat
```

Pseudo

``` ts
tick(delta){

 clock.advance(delta);

 while(queue.peek().time<=clock.now()){

    event=queue.pop();

    dispatcher.dispatch(event);

 }

}
```

------------------------------------------------------------------------

# Event Types

``` text
REQUEST_CREATED

REQUEST_STARTED

NODE_RECEIVED

NODE_QUEUED

WORKER_ASSIGNED

CPU_ASSIGNED

NODE_COMPLETED

NETWORK_TRAVEL

REQUEST_COMPLETED

REQUEST_FAILED
```

Each event contains

``` ts
id

time

requestId

nodeId

payload
```

------------------------------------------------------------------------

# Request Simulation

Request represents a unit of work.

Never store HTTP specific information only.

------------------------------------------------------------------------

## SimRequest

``` ts
id

status

createdAt

startedAt

completedAt

currentNode

nextNode

latency

cpuTime

queueTime

networkTime

databaseTime

cacheHit

retryCount

path

logs
```

------------------------------------------------------------------------

## Request States

``` text
CREATED

WAITING

QUEUED

PROCESSING

NETWORK

COMPLETED

FAILED
```

------------------------------------------------------------------------

## RequestFactory

Creates requests.

``` text
Generate

↓

UUID

↓

Default Metrics

↓

Return SimRequest
```

Never create requests manually.

------------------------------------------------------------------------

## RequestGenerator

Traffic patterns

Constant

Burst

Ramp

Spike

Random

Example

``` text
100 Users

10 Requests/User

↓

1000 SimRequests

↓

REQUEST_CREATED events
```

------------------------------------------------------------------------

# Request Lifecycle

``` text
Factory

↓

REQUEST_CREATED

↓

Client.receive()

↓

Router

↓

Network

↓

LoadBalancer

↓

API

↓

Worker Queue

↓

CPU

↓

Redis

↓

Database

↓

Response

↓

REQUEST_COMPLETED
```

Every stage appends a RequestLog.

------------------------------------------------------------------------

# Request Logger

Instead of strings

Use

``` ts
timestamp

nodeId

event

duration

metadata
```

Example

``` text
0ms

Client

Created
```

``` text
20ms

API

Worker Assigned
```

``` text
50ms

Redis

Cache Hit
```

------------------------------------------------------------------------

# Metrics Updated by Request

Each request updates

-   total latency
-   queue wait
-   cpu execution
-   network delay
-   db wait
-   retries
-   cache hit
-   cache miss

Engine aggregates later.

------------------------------------------------------------------------

# Engine Flow

``` text
Generate Requests

↓

EventQueue

↓

SimulationEngine.tick()

↓

Dispatcher

↓

Node.receive()

↓

Node.process()

↓

Router.forward()

↓

Schedule Next Event

↓

Repeat

↓

Completed
```

------------------------------------------------------------------------

# Design Rules

1.  Engine knows only interfaces.
2.  Nodes own their own state.
3.  Engine never contains Redis logic.
4.  Engine never contains DB logic.
5.  Requests are immutable except lifecycle updates.
6.  Events are append-only.
7.  Every node schedules future events instead of blocking.
8.  All timing uses VirtualClock.
9.  Metrics are event-derived.
10. UI renders engine state only.
