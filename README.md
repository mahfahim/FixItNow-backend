# 🔧 FixItNow Backend API

> A scalable RESTful backend API for a Home Service Marketplace built with **Node.js, Express.js, TypeScript, Prisma, PostgreSQL, and Stripe**.

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Express](https://img.shields.io/badge/Express.js-Backend-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---


FixItNow is a RESTful backend API for a home service marketplace where customers can book professional technicians for different home services such as plumbing, electrical, cleaning, painting, and more.

The system supports three different user roles:

- 👤 Customer
- 🛠 Technician
- 👨‍💼 Admin

Customers can browse available services, create bookings, make online payments, and leave reviews.

Technicians can manage their service profile, availability, and bookings.

Admins can manage the entire platform including users, bookings, categories, and services.

---

# 🚀 Live Links

| Resource | Link |
|----------|------|
| 🌐 Live API | https://fixitnow-backend-tau.vercel.app/ |
| 📮 Postman Documentation | https://documenter.getpostman.com/view/YOUR_POSTMAN_ID |
| 💻 GitHub Repository | https://github.com/mahfahim/FixItNow-backend |

---

# 🎥 Demo Video

https://YOUR_VIDEO_LINK

---

# 👨‍💻 Admin Credentials

```
Email:
fahim@gmail.com

Password:
123456
```

---

# ✨ Features

## Authentication

- JWT Authentication
- Role Based Authorization
- Secure Password Hashing (bcrypt)
- Cookie Based Authentication

---

## Customer

- Register & Login
- Browse Services
- View Technicians
- Create Booking
- View Booking History
- Make Payment
- Submit Reviews

---

## Technician

- Register & Login
- Create Technician Profile
- Manage Services
- Update Availability
- Accept / Decline Booking
- Complete Jobs

---

## Admin

- Manage Users
- Manage Categories
- Manage Services
- View All Bookings
- Block / Unblock Users

---

## Payment

- Stripe Integration
- Payment Intent
- Payment Verification
- Payment Status Tracking

---

# 🛠 Tech Stack

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- JWT
- bcrypt

## Validation

- Zod

## Payment

- Stripe

## Deployment

- Vercel

---

# 📂 Folder Structure

```
FIXITNOW-BACKEND/
├── .vercel/
├── dist/
├── generated/
├── node_modules/
├── prisma/
├── scripts/
├── src/
│   ├── config/
│   │   ├── index.ts
│   │   └── stripe.config.ts
│   ├── errors/
│   │   └── AppError.ts
│   ├── lib/
│   │   └── prisma.ts
│   ├── middlewares/
│   │   ├── auth.ts
│   │   ├── globalErrorHandler.ts
│   │   ├── notFound.ts
│   │   └── validateRequest.ts
│   ├── modules/
│   │   ├── admin/
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.interface.ts
│   │   │   ├── admin.route.ts
│   │   │   ├── admin.service.ts
│   │   │   └── admin.validation.ts
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.interface.ts
│   │   │   ├── auth.route.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── booking/
│   │   │   ├── booking.controller.ts
│   │   │   ├── booking.interface.ts
│   │   │   ├── booking.route.ts
│   │   │   ├── booking.service.ts
│   │   │   └── booking.validation.ts
│   │   ├── category/
│   │   │   ├── category.controller.ts
│   │   │   ├── category.interface.ts
│   │   │   ├── category.route.ts
│   │   │   ├── category.service.ts
│   │   │   └── category.validation.ts
│   │   ├── payment/
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.interface.ts
│   │   │   ├── payment.route.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── payment.utils.ts
│   │   │   └── payment.validation.ts
│   │   ├── review/
│   │   │   ├── review.controller.ts
│   │   │   ├── review.interface.ts
│   │   │   ├── review.route.ts
│   │   │   ├── review.service.ts
│   │   │   └── review.validation.ts
│   │   ├── service/
│   │   │   ├── service.controller.ts
│   │   │   ├── service.interface.ts
│   │   │   ├── service.route.ts
│   │   │   ├── service.service.ts
│   │   │   └── service.validation.ts
│   │   └── technician/
│   │       ├── technician.controller.ts
│   │       ├── technician.interface.ts
│   │       ├── technician.route.ts
│   │       ├── technician.service.ts
│   │       └── technician.validation.ts
│   ├── utils/
│   │   ├── catchAsync.ts
│   │   ├── jwt.ts
│   │   ├── pick.ts
│   │   └── sendResponse.ts
│   ├── app.ts
│   └── server.ts
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── prisma.config.ts
├── README.md
├── tsconfig.json
├── tsup.config.ts
└── vercel.json

```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/FixItNow-backend.git
```

```
cd FixItNow-backend
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env` file.

```env
PORT=5000

DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_ACCESS_EXPIRES_IN=

JWT_REFRESH_SECRET=

JWT_REFRESH_EXPIRES_IN=

BCRYPT_SALT_ROUNDS=

STRIPE_SECRET_KEY=

CLIENT_URL=
```

---

## Generate Prisma Client

```bash
npx prisma generate
```

---

## Run Migration

```bash
npx prisma migrate dev
```

---

## Seed Database

```bash
npm run seed
```

---

## Run Development Server

```bash
npm run dev
```

---

## Build Project

```bash
npm run build
```

---

## Run Production

```bash
npm start
```

---

# 📚 API Endpoints

## Authentication

| Method | Endpoint |
|---------|----------|
| POST | /api/auth/register |
| POST | /api/auth/login |
| GET | /api/auth/me |

---

## Categories

| Method | Endpoint |
|---------|----------|
| GET | /api/categories |
| POST | /api/categories |
| PATCH | /api/categories/:id |
| DELETE | /api/categories/:id |

---

## Services

| Method | Endpoint |
|---------|----------|
| GET | /api/services |
| GET | /api/services/:id |
| POST | /api/services |
| PATCH | /api/services/:id |
| DELETE | /api/services/:id |

---

## Technician

| Method | Endpoint |
|---------|----------|
| GET | /api/technicians |
| GET | /api/technicians/:id |
| PATCH | /api/technician/profile |
| PATCH | /api/technician/availability |

---

## Booking

| Method | Endpoint |
|---------|----------|
| POST | /api/bookings |
| GET | /api/bookings |
| GET | /api/bookings/:id |
| PATCH | /api/bookings/:id |

---

## Payment

| Method | Endpoint |
|---------|----------|
| POST | /api/payments/create |
| POST | /api/payments/confirm |
| GET | /api/payments |
| GET | /api/payments/:id |

---

## Review

| Method | Endpoint |
|---------|----------|
| POST | /api/reviews |
| GET | /api/reviews |

---

## Admin

| Method | Endpoint |
|---------|----------|
| GET | /api/admin/users |
| PATCH | /api/admin/users/:id |
| GET | /api/admin/bookings |
| GET | /api/admin/categories |

---

# 🗄 Database Schema

## ER Diagram

> Add your ER Diagram image here.

```
docs/database-schema.png
```

or

```
docs/database-schema.pdf
```

---

## Database Tables

- Users
- TechnicianProfiles
- Categories
- Services
- Bookings
- Payments
- Reviews

---

## Relationships

```
User
│
├── TechnicianProfile

User
│
├── Booking

Technician
│
├── Booking

Category
│
├── Service

Booking
│
├── Payment

Booking
│
├── Review
```

---

# 🧪 Error Response Format

```json
{
  "success": false,
  "message": "Validation Error",
  "errorDetails": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

# ✅ Validation

This project performs server-side validation using **Zod**.

---

# 🔐 Authentication

JWT Authentication

Role Based Authorization

Protected Routes

Secure Password Hashing

---

# 💳 Payment Gateway

Stripe Payment Gateway

Payment Intent

Payment Confirmation

Payment Status Tracking

---

# 📦 Deployment

Backend deployed on

- Vercel

Database

- PostgreSQL

---

# 📄 API Documentation

Postman Documentation

https://documenter.getpostman.com/view/YOUR_POSTMAN_ID

---

# 📌 Future Improvements

- Email Notifications
- Real-time Chat
- Push Notifications
- Image Upload
- Dashboard Analytics
- Docker Support
- CI/CD Pipeline

---

# 👨‍💻 Author

**Md. Abdul Hai Fahim**

Computer Science & Engineering

Patuakhali Science and Technology University

GitHub:
https://github.com/YOUR_USERNAME

LinkedIn:
https://linkedin.com/in/YOUR_PROFILE

---

# 📜 License

This project is licensed under the MIT License.

---

⭐ If you like this project, don't forget to give it a Star.