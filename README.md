# Nexus Node API 🚀

Welcome to the enterprise-grade Node.js backend for the Nexus application suite. This API is built on Express.js and features heavily hardened, industry-standard security architectures including advanced **HttpOnly JWT Token Rotation**.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **PNPM** (We strictly use `pnpm` as our package manager. Do not use `npm` or `yarn`!)

---

## 🛠 Installation & Setup

1. **Install Dependencies**
   Navigate to this directory and install all required modules exactly as defined in the `pnpm-lock.yaml`:
   ```bash
   pnpm install
   ```

2. **Environment Configuration** 🔐
   We do not commit sensitive API keys or database passwords to version control. You must generate your own local environment file. 
   
   Run the following command to copy the template:
   ```bash
   cp .env.example .env
   ```
   **Important:** Open your newly created `.env` file and replace the dummy strings (like `your_access_token_secret_here`) with actual cryptographic hashes. 

---

## 💻 Running the Server

**Development Mode (Auto-reloads on file shifts):**
```bash
pnpm dev
```

**Production Mode:**
```bash
pnpm start
```

By default, the API will spin up on `http://localhost:3000`.

---

## 🏛 Architecture Overview

- **`/src/controllers`**: The brain. Handles incoming HTTP requests and structures the outbound JSON responses.
- **`/src/services`**: The muscle. Handles the heavy lifting, business logic, Database queries, and complex JWT cryptology.
- **`/src/middlewares`**: The shield. Intercepts traffic to enforce Rate Limiting, Helmet Security Headers, Cors, and JSON parsing.
- **`/src/constants`**: The dictionary. A centralized location for all magic strings, error messages, and URL structures to support future Internationalization (i18n).
- **`/src/routes`**: The map. Links your API endpoint URLs (like `/api/auth/login`) directly to their Controller functions.

---

## 🛡 Security Notes
- **JWT Master Keys:** The Refresh Tokens are completely stripped from JSON bodies and issued strictly through `HttpOnly`, `SameSite=Strict` cookies.
- **CORS:** Cross-Origin requests are explicitly locked to specific environments defined in your `.env` (e.g. `http://localhost:4200`).
- **Rate Limiting:** IP addresses are restricted to 100 requests per 15-minute window to mitigate DDoS attacks.

---

*For frontend integration, ensure the Angular proxy or environment API URL is successfully pointing to this Node instance.*
