# Quick Setup Guide

## Step 1: Install Dependencies
```bash
cd admin
npm install
```

## Step 2: Configure Environment
```bash
cp .env.example .env
```

Edit `.env` if you need to change the API URL:
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Step 3: Start Development Server
```bash
npm run dev
```

The dashboard will open at **http://localhost:3003**

## Step 4: Login

Use your employee credentials from the backend. If you haven't created an admin user yet, you can create one via the backend API:

```bash
POST http://localhost:5000/api/v1/employees/register
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@womensden.com",
  "phone": "+263771234567",
  "password": "admin123",
  "businessUnit": "all",
  "role": "super_admin",
  "position": "System Administrator"
}
```

## What You Get

### ✅ Stunning Dashboard
- Beautiful charts and analytics
- Real-time statistics
- Activity feed
- Upcoming events

### ✅ Complete Layout System
- Collapsible sidebar with navigation
- Topbar with search and notifications
- Responsive design
- Smooth animations

### ✅ Business Unit Navigation
- The Ring (Gym)
- The Olive Room (Spa)
- The Edit Collection (Manufacturing)
- Childcare
- TWD Marketing

### ✅ Shared Services
- Vouchers
- Inventory
- Accounting
- Kiosk System
- Leaderboard

### ✅ Components Ready
- StatCard with trends
- Card component
- Button component with variants
- Layout components
- Auth system

## Next Steps

You can now build out individual business unit pages by:

1. Creating new page components in `src/pages/`
2. Adding routes in `src/App.jsx`
3. Using the existing components in `src/components/`
4. Connecting to API endpoints from `src/services/api.js`

## Color Scheme

The dashboard uses your kiosk colors:
- **Primary**: #23839b (Teal)
- **Accent**: #ebbf9a (Gold)
- **Success**: #10b981
- **Error**: #ef4444

Enjoy your beautiful admin dashboard! 🎉
