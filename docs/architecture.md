# System Architecture

## Overview

The system is composed of three main components:

1. Frontend (Web Client)
2. Backend API
3. AI Inference Service

Each component has a clearly defined responsibility.

---

## Frontend

**Responsibilities**
- User interface
- Form validation
- Image upload
- Display of AI results

**Does NOT**
- Perform business logic
- Make direct AI calls

---

## Backend API

**Responsibilities**
- Authentication & authorization
- Business rules
- Data persistence
- Orchestration between frontend and AI service

**Acts as**
- The single source of truth
- The gateway to all system operations

---

## AI Service

**Responsibilities**
- Food recognition from images
- Return detected food items and confidence scores

**Constraints**
- Provides approximate results
- No medical guarantees
- Can be unavailable without breaking the system

---

## Communication

- Frontend → Backend: REST (JSON)
- Backend → AI Service: REST (multipart/form-data)

---

## Key Principles

- API-first design
- Loose coupling between services
- Explicit handling of AI uncertainty
