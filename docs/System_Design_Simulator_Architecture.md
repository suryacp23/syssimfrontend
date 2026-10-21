
# Modular System Design Simulator Architecture

## Vision

Build an event-driven simulator that teaches how distributed systems
work instead of merely drawing architecture diagrams.

Every node is an independent simulation module with its own resources,
queue, metrics, failures, and routing rules.

## Simulation Flow

``` text
Client
   │
Load Generator
   │
Network
   │
Load Balancer
   │
API Thread Pool
   │
CPU Scheduler
   │
Redis
   │
Database Connection Pool
   │
Database
```

------------------------------------------------------------------------

# Folder Structure

``` text
simulation/
├── engine/
│   ├── SimulationEngine.ts
│   ├── EventQueue.ts
│   ├── VirtualClock.ts
│   └── Router.ts
│
├── nodes/
│   ├── BaseNode.ts
│   ├── ClientNode.ts
│   ├── LoadBalancerNode.ts
│   ├── APINode.ts
│   ├── QueueNode.ts
│   ├── RedisNode.ts
│   ├── DatabaseNode.ts
│   ├── CDNNode.ts
│   └── WorkerNode.ts
│
├── scheduler/
│   ├── ThreadPool.ts
│   ├── Worker.ts
│   ├── CPUScheduler.ts
│   ├── CPUCore.ts
│   ├── ReadyQueue.ts
│   └── ContextSwitch.ts
│
├── network/
│   ├── NetworkLink.ts
│   ├── Packet.ts
│   ├── PacketScheduler.ts
│   └── BandwidthLimiter.ts
│
├── database/
│   ├── ConnectionPool.ts
│   ├── Transaction.ts
│   ├── LockManager.ts
│   └── DiskScheduler.ts
│
├── redis/
│   ├── RedisCache.ts
│   ├── CacheEntry.ts
│   ├── EvictionPolicy.ts
│   └── TTLManager.ts
│
├── load/
│   ├── LoadGenerator.ts
│   ├── VirtualUser.ts
│   └── TrafficPattern.ts
│
├── metrics/
├── failures/
└── ui/
```

# Core Concepts

## SimulationEngine

Only orchestrates.

Responsibilities:

-   advance virtual clock
-   dispatch events
-   ask nodes to process requests
-   collect metrics

Never contains Redis, Database, CPU or Queue logic.

------------------------------------------------------------------------

# BaseNode

Every node extends BaseNode.

Properties

-   nodeId
-   processing latency
-   queue
-   workers
-   metrics
-   failure state

Functions

-   receive()
-   process()
-   complete()
-   forward()

------------------------------------------------------------------------

# Part 1 -- Thread Pool

Each API node owns a ThreadPool.

Worker lifecycle:

Waiting -\> Busy -\> Finished -\> Waiting

Configurable:

-   max workers
-   queue size
-   worker speed

------------------------------------------------------------------------

# Part 2 -- CPU Scheduler

Global CPU Scheduler

Configurable:

-   CPU cores
-   context switch cost
-   scheduling algorithm (Round Robin, FCFS)

Flow

Worker -\> Ready Queue -\> CPU Core -\> Execute

If workers \> cores, requests wait in the ready queue.

------------------------------------------------------------------------

# Part 3 -- Database Connection Pool

Database node owns a connection pool.

Settings

-   pool size
-   wait timeout
-   query latency

If pool exhausted:

Request waits.

If timeout expires:

Request fails.

------------------------------------------------------------------------

# Part 4 -- Redis

Redis node simulates

-   cache hit ratio
-   TTL
-   LRU eviction
-   memory limit

Flow

GET

Hit

Return immediately

Miss

Forward to Database

Save

Return

------------------------------------------------------------------------

# Part 5 -- Network

Every edge is a NetworkLink.

Properties

-   latency
-   packet loss
-   bandwidth
-   jitter

Requests travel through links before reaching destination.

------------------------------------------------------------------------

# Node Responsibilities

## Client

Generates requests.

## Queue

FIFO waiting area.

Tracks queue depth.

Supports overflow.

## API

Owns ThreadPool.

Schedules work.

Calls Redis or Database.

## Redis

Cache simulation.

## Database

Owns ConnectionPool.

Simulates locks and transactions.

## Load Balancer

Supports

-   Round Robin
-   Least Connections
-   Random
-   Weighted Round Robin

## CDN

Edge cache.

Returns static assets immediately.

------------------------------------------------------------------------

# Event Types

-   REQUEST_CREATED
-   NODE_RECEIVED
-   QUEUED
-   THREAD_ASSIGNED
-   CPU_ASSIGNED
-   CPU_RELEASED
-   CACHE_HIT
-   CACHE_MISS
-   DB_CONNECTION_ACQUIRED
-   DB_CONNECTION_RELEASED
-   NETWORK_TRAVEL
-   REQUEST_COMPLETED
-   REQUEST_FAILED

------------------------------------------------------------------------

# UI Ideas

Show:

-   CPU cores
-   Worker threads
-   Queue depth
-   Active DB connections
-   Redis hit ratio
-   Autoscaling
-   Live request paths
-   Latency histogram
-   Throughput
-   Errors

------------------------------------------------------------------------

# Future

-   Docker mode
-   Real Redis
-   Real PostgreSQL
-   Kafka/RabbitMQ
-   Kubernetes autoscaling
-   Service Mesh
-   Distributed tracing
-   Chaos engineering
