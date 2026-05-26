# Personalized Dietary Assessment Platform 🍎🥗

A web-based platform for **personalized nutrition consultation** and **AI-assisted calorie estimation**, developed as an academic project for L3 Computer Science.

The system combines:

- Professional nutritionist consultations
- Structured diet plans and subscriptions
- AI-based food recognition for approximate calorie estimation
- Multiple dashboard systems for: Clients, Nutritionists, Admin
- Nutrition chatbot & platform helper

> ⚠️ Disclaimer:  
> This platform provides **approximate dietary insights** and **does not replace medical advice**.

---

## 🧠 Project Overview

Users can:

- Create a personal profile information, health history & calorie and nutrient goals
- View and edit profile information
- View overview statistics on their nutrition
- View and Follow personalized nutrition plans designed by professionals
- View notifications
- Upload meal images for AI-assisted calorie estimation
- Manage and track meal history
- Book and attend online nutrition consultations
- Share posts and engage with the community throught comments and replies (subject to admin approval/rejection)
- Manage personal subscription (free / premium)
- Check invoices and download as PDF
- Contact Adminstrators through the support ticket system
- Track progress over time
- Post reviews and star ratings for meal plans and consultations (nutritionists)

Nutritionists can:

- Create a personal profile through strict registration subject to administrator approval/rejection
- View and edit profile information
- View notifications
- View overview dashboard statistics and earnings chart
- View and manage weekly schedule through a visual weekly time grid with real time configuration and holiday management
- View patient list with patient calorie tagret progress charts and meal plan progression with personalized meal plan creation interface
- Manage and conduct online consultation throught Zoom call integration
- Construct and view/edit public marketplace meal plans (general & seasonal)
- View earnings through commission, Invoices, and payout history
- Contact Adminstrators through the support ticket system

Administrators can:

- View overview website statistics and recent activity (sign ups, pending approvals, plans...etc)
- View notifications
- Manage users (Nutritonists and Clients), View, ban, unban and delete permanently (soft delete on db).
- Manage nutritionist application approvals
- Manage pending plan approvals, manage live marketplace
- Manage platform subscription content and price
- Manage community content (approve posts, reject, hide , delete)
- Manage blog editorial content
- Respond to inquireies and tickets (support)

---

## 🏗 Architecture Overview

This project follows an **API-first modular monolith architecture** with a dedicated AI service.

Frontend (React)  
↓  
Backend API (Express / Django) → PostgreSQL database  
↓  
AI Service (FastAPI + YOLOv8)

- Frontend handles UI and user interactions
- Backend handles authentication, business logic, and data storage
- AI service performs food recognition and estimation

---

## 🧰 Tech Stack

**Frontend**
- NextJS
- React
- HTML / CSS / JavaScript/Typescript

**Backend**
- Django REST Framework
- JWT Authentication
- PostgreSQL

**AI Service**
- Python
- FastAPI
- YOLOv8l-seg (pretrained + adjusted)

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

## 🔐 Security & Privacy Considerations

- Role-based access control across Clients, Nutritionists, and Administrators
- JWT-based stateless authentication for API communication
- Separation of sensitive health data from public community content
- Nutritionist access limited strictly to their own patients
- Administrative moderation layers for community posts, plans, and professional profiles
- Soft-delete mechanisms to preserve data integrity and auditability

---

## 💳 Payments, Subscriptions & Invoicing

- Tiered access model (Free vs Premium)
- Premium features gated at the backend and UI level
- Transaction simulation with unique invoice generation
- Centralized invoice history with PDF export
- Commission-based revenue model for nutritionists
- Administrative control over subscription pricing and platform offerings

---

## 🤖 AI & Data Processing Pipeline

- Image-based food recognition using segmentation models
- Portion estimation with user-adjustable correction layer
- Automatic macro and calorie calculation
- Incremental updates to daily nutrition metrics
- Decoupled AI service to allow independent scaling and iteration
- Designed to support future model upgrades or alternative inference engines

---

## 🌍 Platform Usability & Experience

- Role-specific dashboards with tailored navigation and data visibility
- Progressive onboarding for users with health and goal profiling
- Visual progress indicators and charts for long-term tracking
- Community features designed with moderation-first workflows
- Marketplace-style browsing for meal plans and consultations
- Notification system for cross-role communication and updates

---

## 📊 Monitoring, Reliability & Maintainability

- Clear separation of concerns between frontend, backend, and AI services
- API contracts documented and version-aware
- Database schema designed around traceability (users, plans, consultations, invoices)
- Structured logging and error handling at the API layer
- Architecture designed to support future horizontal scaling

---

## 🚀 Extensibility & Future Evolution

The platform is designed to support future enhancements such as:

- Advanced analytics and personalized insights
- Additional AI-assisted dietary features
- Internationalization and localization
- Expanded professional roles
- Integration with wearable or external health data sources
- Real payment gateway integration
- Enhanced recommendation systems

---

## 👥 Team & Workflow

This project is developed using:

- Feature-based Git branches
- Pull Requests with mandatory review
- Documented API contracts

See [`docs/git-workflow.md`](docs/git-workflow.md) for details.

---

## 📜 License

GNU Affero General Public License v3.0
