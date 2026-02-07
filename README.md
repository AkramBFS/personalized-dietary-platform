# Personalized Dietary Assessment Platform 🍎🥗

A web-based platform for **personalized nutrition consultation** and **AI-assisted calorie estimation**, developed as an academic project for L3 Computer Science.

The system combines:
- Professional nutritionist consultations
- Structured diet plans and subscriptions
- AI-based food recognition for approximate calorie estimation

> ⚠️ Disclaimer:  
> This platform provides **approximate dietary insights** and **does not replace medical advice**.

---

## 🧠 Project Overview

Users can:
- Create a personal profile and health history
- Upload meal images for AI-assisted calorie estimation
- Follow personalized nutrition plans designed by professionals
- Book and attend online nutrition consultations
- Track progress over time

Nutritionists can:
- Manage consultations
- Create and adjust nutrition plans
- Monitor user progress

Administrators can:
- Manage users, nutritionists, and content
- Oversee subscriptions and platform operations

---

## 🏗 Architecture Overview

This project follows an **API-first modular monolith architecture** with a dedicated AI service.

Frontend (React)
↓
Backend API (Express / Django)
↓
AI Service (FastAPI + YOLOv8)


- Frontend handles UI and user interactions
- Backend handles authentication, business logic, and data storage
- AI service performs food recognition and estimation

---

## 🧰 Tech Stack

**Frontend**
- React (Vite)
- HTML / CSS / JavaScript

**Backend**
- Node.js (Express) or Django REST Framework
- JWT Authentication
- PostgreSQL

**AI Service**
- Python
- FastAPI
- YOLOv8 (pretrained)

**DevOps**
- GitHub (monorepo)
- Docker (later phase)

---

## 📂 Repository Structure

/
├── frontend/ # React application
├── backend/ # Backend API
├── ai-service/ # AI inference service
├── docs/ # Architecture & API documentation
├── .github/ # GitHub automation & templates
└── README.md


---

## 🚀 Getting Started (Development)

> Setup instructions will be added once core services are initialized.

---

## 👥 Team & Workflow

This project is developed using:
- Feature-based Git branches
- Pull Requests with mandatory review
- Documented API contracts

See [`docs/git-workflow.md`](docs/git-workflow.md) for details.

---

## 📜 License

Academic use only.
