# CasaStay

Production-Ready Airbnb-Like Full-Stack Web Application  
Built for real-world backend architecture, secure OTP systems, and webhook-controlled RazorPay payment processing.


# Project Setup & Running Locally

## 1 Clone the Repository

git clone https://github.com/khizer08/CasaStay
cd casastay

## 2️ Install Dependencies

npm install

## 3️ Create Environment Variables

Create a `.env` file in the root directory:

# MongoDB

ATLASDB_URL=your_mongodb_atlas_connection_string

# Session Secret

SECRET=your_session_secret

# Razorpay

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Email (Brevo / SMTP)

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

# Cloudinary

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret

## 4️ Run the Application

nodemon app.js

Server runs on: http://localhost:8080

## 5️ Webhook Testing (Local Development)

Use ngrok to expose your local server:

ngrok http 8080

Set Razorpay webhook URL to: https://your-ngrok-url/webhook/razorpay

# Overview

CasaStay is a production-oriented Airbnb-like booking platform built using:

- Node.js
- Express.js
- MongoDB (Atlas)
- EJS (Server-Side Rendering)
- Clean MVC Architecture
- Razorpay Payment Gateway
- Webhook-Based Payment & Refund Confirmation
- Cloudinary Image Hosting

This project focuses on backend authority, payment integrity, OTP security, and real production architecture.

---

# Core Features

## Authentication & Authorization

- Passport.js with `passport-local-mongoose`
- Email-based authentication
- MongoDB-backed session store (`connect-mongo`)
- Flash messaging with session persistence
- Ownership-based route protection
- Centralized error handling middleware
- Joi validation for request data
- Secure environment variable handling

---

# Advanced OTP System (Database-Controlled)

Email verification is mandatory before login.

### OTP Implemented For

- Signup verification
- Login verification (if unverified)
- Forgot password
- Password reset
- Booking cancellation

### OTP Security Design

- OTP hashed before storage
- Expiry timestamps enforced
- Attempts tracked in database
- 3 resend attempts per 10-minute window
- Attempts auto-reset after window expiry
- Attempts reset after successful verification
- Modular EJS-based email templates

---

# Listings System

- Full CRUD functionality
- Owner-based authorization
- Cloudinary image upload
- Geocoding with latitude & longitude storage
- Leaflet map integration
- Search + UI-level filtering
- Tax toggle calculation
- Responsive design

---

# Reviews System

- Review creation
- Author-based delete authorization
- Star rating UI
- Joi server-side validation

---

# Booking System (Production-Level Payment Architecture)

## Booking Model Includes

- user
- listing
- checkIn
- checkOut
- nights
- pricePerNight
- taxes
- totalAmount
- razorpayOrderId
- razorpayPaymentId
- razorpaySignature
- paymentStatus
- bookingStatus
- cancelOTPHash
- cancelOTPExpires
- cancelOTPAttempts
- cancelOTPLastSentAt

### Enums

**paymentStatus**

- pending
- paid
- refunded

**bookingStatus**

- pending
- confirmed
- cancelled

---

# Razorpay Payment Flow (Webhook-Controlled)

1. Booking created → `paymentStatus: "pending"`
2. Razorpay order generated
3. User completes payment
4. Frontend verifies signature
5. Payment IDs saved (not confirmed yet)
6. Razorpay sends webhook → `payment.captured`
7. Backend verifies HMAC SHA256 signature
8. Booking updated:
   - `paymentStatus → paid`
   - `bookingStatus → confirmed`
9. Booking appears in "My Bookings"

Webhook is backend-authoritative.

---

# Cancellation & Refund Flow

1. User initiates cancellation
2. Cancellation OTP sent
3. OTP verification required
4. Razorpay refund API triggered
5. Razorpay webhook → `refund.processed`
6. Backend verifies signature
7. Booking updated:
   - `paymentStatus → refunded`
   - `bookingStatus → cancelled`
8. Refund confirmation email sent

---

# Razorpay Webhook Integration

- `express.raw()` for raw body parsing
- HMAC SHA256 verification
- Webhook secret stored in `.env`
- Local testing via ngrok
- Production webhook configured on Render

---

# Security Practices

- No secrets committed to GitHub
- All sensitive values in `.env`
- OTP hashed before storage
- Webhook signature validation
- Ownership validation on protected routes
- Enum validation enforcement
- Joi validation middleware
- Backend-authoritative payment system

---

# Project Structure

```
CASASTAY/
│
├── controllers/
├── models/
├── routes/
├── utils/
├── public/
├── views/
├── app.js
├── middleware.js
├── cloudConfig.js
├── razorpayConfig.js
├── schema.js
├── package.json
└── README.md
```

---

# Current Status

- Razorpay integration working
- Webhook-based confirmation working
- Webhook-based refund working
- OTP flows stable
- Email system stable
- Deployment stable on Render
- Production-ready MVP
- Clean modular MVC architecture
- Backend-authoritative payment lifecycle


CasaStay is built with backend-first authority, database-driven OTP control, webhook-controlled financial state changes, and production-level security standards.
