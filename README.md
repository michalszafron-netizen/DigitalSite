# DigitalSite - Portfolio & Services Website

A modern React + TypeScript + Express.js application for showcasing digital services and products with payment integration.

## Features

- React frontend with TypeScript
- Express.js backend API
- SQLite database (local) / PostgreSQL (production)
- Payment integrations (Stripe, Przelewy24)
- Email notifications
- Admin dashboard
- Contact form
- Product and service management

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your configuration

### Running Locally

1. Build the frontend:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. For development with hot reload:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002

## Railway Deployment

This application is configured for easy deployment on Railway.

### Prerequisites
1. Railway account (https://railway.app)
2. GitHub repository with this code

### Deployment Steps

1. **Connect to Railway**
   - Go to Railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables**
   - In Railway dashboard, go to your project → Variables
   - Add all variables from `.env.example`
   - Update `FRONTEND_URL` and `BACKEND_URL` to your Railway domain
   - Set `P24_SANDBOX=true` for testing payments

3. **Deploy**
   - Railway will automatically detect the configuration
   - It will build and deploy the application
   - The deployment will be available at `https://your-app-name.up.railway.app`

4. **Database (Optional)**
   - Railway automatically provides PostgreSQL
   - The app uses SQLite locally but can be configured for PostgreSQL

### Railway Configuration Files

- `railway.json` - Railway deployment configuration
- `nixpacks.toml` - Build configuration for Railway

## Environment Variables

See `.env.example` for all required environment variables.

## API Endpoints

- `GET /api/products` - Get all products
- `POST /api/contact` - Submit contact form
- `POST /api/payments/stripe/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/p24/register` - Register Przelewy24 transaction
- `GET /api/admin/submissions` - Get contact submissions (admin)
- And more...

## Troubleshooting

### Common Issues

1. **Server crashes with PathError**
   - Fixed in current version (Express 5 compatibility issue)

2. **Missing environment variables**
   - Ensure all required variables are set in Railway

3. **Payment gateways not working**
   - Check API keys and sandbox/test mode settings
   - Verify webhook URLs are correctly configured

## License

MIT
