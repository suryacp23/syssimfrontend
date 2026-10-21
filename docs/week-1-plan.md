# System Design Simulator - Week 1 Development Plan

## 🎯 Week 1 Goal

By the end of Week 1, the application should support:

* User Authentication (JWT)
* Project Management (CRUD)
* React Flow-based System Design Editor
* Save & Load Diagrams
* PostgreSQL Integration
* Dockerized Development Environment
* Clean Project Architecture

> **Scope:** Only build the editor and persistence layer. No simulation logic yet.

---

# Tech Stack

## Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* React Flow
* Zustand
* TanStack Query
* Axios
* React Hook Form
* Zod
* shadcn/ui

## Backend

* Spring Boot 3
* Spring Web
* Spring Data JPA
* Spring Security
* JWT Authentication
* PostgreSQL
* Flyway
* Lombok
* MapStruct
* Jakarta Validation
* Docker

---

# Project Structure

## Frontend

```
frontend/
│
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── editor/
│   └── layout.tsx
│
├── components/
│   ├── canvas/
│   ├── sidebar/
│   ├── toolbar/
│   ├── properties/
│   └── ui/
│
├── hooks/
├── services/
├── store/
├── types/
├── lib/
└── utils/
```

---

## Backend

```
backend/
└── src/main/java/com/simulator
    ├── config/
    ├── controller/
    ├── dto/
    ├── entity/
    ├── repository/
    ├── security/
    ├── service/
    ├── mapper/
    ├── exception/
    └── util/
```

---

# Database Design

## User

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| name       | VARCHAR   |
| email      | VARCHAR   |
| password   | VARCHAR   |
| created_at | TIMESTAMP |

---

## Project

| Column      | Type      |
| ----------- | --------- |
| id          | UUID      |
| title       | VARCHAR   |
| description | TEXT      |
| owner_id    | UUID      |
| created_at  | TIMESTAMP |
| updated_at  | TIMESTAMP |

---

## Node

| Column     | Type    |
| ---------- | ------- |
| id         | UUID    |
| project_id | UUID    |
| type       | VARCHAR |
| x          | DOUBLE  |
| y          | DOUBLE  |
| width      | DOUBLE  |
| height     | DOUBLE  |
| data       | JSONB   |

---

## Edge

| Column     | Type    |
| ---------- | ------- |
| id         | UUID    |
| project_id | UUID    |
| source     | UUID    |
| target     | UUID    |
| label      | VARCHAR |

---

# Day 1 - Project Setup

## Backend

### Tasks

* Create Spring Boot project
* Configure PostgreSQL
* Configure Flyway
* Create Docker Compose
* Create Health API

### Dependencies

* Spring Web
* Spring Data JPA
* PostgreSQL Driver
* Flyway
* Lombok
* Validation
* Spring Security
* JWT

### Endpoint

```
GET /health
```

Response

```json
{
  "status": "ok"
}
```

### Deliverables

* Spring Boot running
* PostgreSQL connected
* Flyway migration working
* Docker Compose running
* Health endpoint accessible

---

## Frontend

### Tasks

* Create Next.js project
* Configure Tailwind
* Install shadcn/ui
* Install React Flow
* Install Zustand
* Install TanStack Query
* Install Axios
* Install React Hook Form
* Install Zod

### Initial Layout

```
--------------------------------------------

Navbar

--------------------------------------------

Sidebar | Canvas | Properties Panel

--------------------------------------------

Bottom Status Bar

--------------------------------------------
```

### Deliverables

* Frontend running
* Backend connection tested
* Base layout complete
