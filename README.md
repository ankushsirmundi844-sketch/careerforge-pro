# CareerForge Pro 🚀
**AI Resume Architect & ATS Optimizer**
*Zaalima Development — Q4 AI Product Roadmap | Project 2*

---

## Overview
CareerForge Pro is an AI-powered SaaS resume builder that:
- Analyzes job descriptions to extract ATS keywords
- Rewrites resume bullets with Gemini 1.5 Flash to match target JDs
- Calculates an ATS compatibility score
- Generates pixel-perfect PDFs via Puppeteer (Headless Chrome)
- Offers Free & Pro tiers via Stripe subscriptions
- Generates cover letters (Pro only)

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| AI | Gemini 1.5 Flash (Google AI Studio) |
| PDF | Puppeteer (Headless Chrome) |
| Payments | Stripe Checkout + Webhooks |
| Infra | Docker, Nginx |

---

## Project Structure
```
careerforge-pro/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── models/          # User, Resume
│   ├── controllers/     # auth, resume, ai, pdf, payment
│   ├── routes/          # auth, resume, ai, payment
│   ├── services/        # aiService.js, pdfService.js
│   ├── middleware/      # auth.js (JWT + plan guard)
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/       # Landing, Login, Register, Dashboard, Builder, Pricing
│   │   ├── context/     # authStore.js, resumeStore.js (Zustand)
│   │   └── utils/       # api.js (Axios)
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

---

## Quick Start

### 1. Clone & configure environment
```bash
cd backend && cp .env.example .env
# Fill in MONGODB_URI, GEMINI_API_KEY, STRIPE_SECRET_KEY, etc.

cd ../frontend && cp .env.example .env
# Fill in REACT_APP_STRIPE_PUBLISHABLE_KEY
```

### 2. Run with Docker
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api

### 3. Run locally (dev)
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm start
```

---

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Resume
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/resume | All user resumes |
| POST | /api/resume | Create resume |
| PUT | /api/resume/:id | Update resume |
| DELETE | /api/resume/:id | Delete resume |
| POST | /api/resume/:id/download-pdf | Download PDF |

### AI
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/ai/analyze-jd | Extract JD keywords |
| POST | /api/ai/rewrite-bullet | Rewrite single bullet |
| POST | /api/ai/optimize-resume/:id | Full AI optimization |
| POST | /api/ai/ats-score/:id | Calculate ATS score |
| POST | /api/ai/cover-letter/:id | Generate cover letter (Pro) |

### Payment
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/payment/create-checkout-session | Start Stripe checkout |
| POST | /api/payment/webhook | Stripe webhook handler |
| POST | /api/payment/cancel-subscription | Cancel subscription |

---

## SaaS Plans
| Feature | Free | Pro |
|---------|------|-----|
| Resumes | 1 | Unlimited |
| Templates | Classic | All 3 |
| AI Optimization | ✗ | ✓ |
| Cover Letter | ✗ | ✓ |
| PDF Download | ✓ | ✓ |
| Price | $0 | $9/mo |

---

## Stripe Setup
1. Create a product in Stripe Dashboard → Monthly subscription → $9/mo
2. Copy the Price ID to `STRIPE_PRO_PRICE_ID` in `.env`
3. Set up webhook endpoint: `POST /api/payment/webhook`
4. Listen for: `checkout.session.completed`, `customer.subscription.deleted`

---

*Zaalima Development | Intelligence is artificial. Competence is mandatory.*
