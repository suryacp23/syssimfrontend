# System Design Simulator — Frontend (`syssimfrontend`)

An interactive, visual distributed system design and simulation platform. Design architectures using an intuitive drag-and-drop canvas, configure real-world node behaviors (APIs, Load Balancers, Caches, Message Queues, Databases), and run discrete-event simulations with real-time metrics, bottleneck detection, and failure scenarios.

---

## 🚀 Features

- **Interactive Canvas**: Drag-and-drop system design components powered by `@xyflow/react` (React Flow).
- **Realistic Component Nodes**:
  - **Client**: Traffic generators with customizable load patterns (constant, spike, sine wave, ramp).
  - **API Gateway / Service**: Request validation, processing latency, rate limiting, and routing.
  - **Load Balancer**: Round-robin, least-connections, and random distribution algorithms.
  - **Redis / Cache**: In-memory caching with configurable TTL, cache hit/miss latency, and eviction policies.
  - **Message Broker / Queue**: Asynchronous message processing (Kafka, RabbitMQ semantics).
  - **Databases**: Relational and NoSQL database query execution simulation with connection pooling and storage metrics.
- **Discrete Event Simulation Engine**:
  - Virtual clock simulation engine with priority event queue.
  - Real-time packet routing, latency calculation, and bandwidth simulation.
  - Dedicated Web Worker execution for high-performance simulation without blocking UI rendering.
- **Chaos & Failure Engineering**:
  - Node crashes, network partition, latency spikes, and packet drop injection.
  - Circuit breakers, timeout handlers, and exponential backoff retry policies.
- **Real-Time Analytics & Observability**:
  - Live charts for throughput (RPS), p50/p95/p99 latency, error rates, and resource utilization (CPU/Memory).
  - End-to-end request timeline tracing and logs inspection.
- **Project Management**: Save, load, duplicate, and manage system architectures.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Visual Graph / Canvas**: [@xyflow/react](https://reactflow.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: Tailwind CSS & Lucide Icons
- **Simulation**: Custom Discrete Event Simulation (DES) Engine + Web Workers
- **Language**: TypeScript

---

## 🏁 Getting Started

### Prerequisites

- Node.js (v18.17.0 or later recommended)
- npm, pnpm, or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/suryacp23/syssimfrontend.git
   cd syssimfrontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages and layouts
├── components/           # React UI components
│   ├── canvas/           # Canvas workspace, sidebar, controls, custom nodes/edges
│   ├── dashboard/        # Project management dialogs and cards
│   ├── failure/          # Chaos engineering and failure panels
│   ├── scaling/          # Auto-scaling and load configuration
│   └── ui/               # Reusable UI primitives
├── hooks/                # Custom React hooks (useSimulation, useWorker)
├── metrics/              # Metrics dashboard and request history
├── simulation/           # Simulation core engine
│   ├── database/         # Database simulation models
│   ├── engine/           # Event queue, virtual clock, router, engine
│   ├── failure/          # Circuit breaker, retry policy, timeout handler
│   ├── load/             # Traffic generation and resource management
│   ├── network/          # Network latency and packet models
│   ├── nodes/            # Node-specific handlers (Client, API, Redis, DB, etc.)
│   ├── request/          # Request generation and tracking
│   └── types/            # TypeScript models and interfaces
├── store/                # Zustand state stores (canvas, simulation, failure, metrics)
└── workers/              # Dedicated Web Workers for simulation execution
```

---

## 📄 License

MIT
