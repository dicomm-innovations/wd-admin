# Women's Den ERP - Admin Dashboard

A comprehensive, feature-rich admin dashboard for managing the Women's Den ERP System across all 5 business units with real-time updates and modern tooling.

## ✨ Features

- **Beautiful UI** - Modern design using the same colors and branding as the kiosk
- **Multi-Business Unit Management** - Manage Gym, Spa, Manufacturing, Childcare, and Marketing
- **Real-time Updates** - WebSocket integration for live data synchronization
- **Toast Notifications** - Beautiful non-intrusive notifications for user feedback
- **Data Export** - Export to CSV, Excel, JSON, and PDF
- **Comprehensive Utilities** - Date/currency formatting, debouncing, pagination, and more
- **Settings Page** - User profile, password management, notifications, and preferences
- **Role-Based Access Control** - Different permissions for different admin roles
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Ready** - Color scheme optimized for both light and dark themes

## 🏗️ Tech Stack

- **Frontend**: React 19 (JavaScript)
- **Routing**: React Router v7
- **Real-time**: Socket.IO Client
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite 7
- **State Management**: Context API
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- Backend server running on http://localhost:5000

### Installation

1. Navigate to the admin directory:
   ```bash
   cd admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and visit http://localhost:3003

### Default Login

Use any employee credentials from your backend. For super admin access:
- Email: `admin@womensden.com`
- Password: (as configured in your backend)

## Project Structure

```
admin/
├── src/
│   ├── assets/              # Images, fonts, etc.
│   ├── components/
│   │   ├── common/          # Reusable components (Button, Card, etc.)
│   │   ├── layout/          # Layout components (Sidebar, Topbar)
│   │   ├── dashboard/       # Dashboard-specific components
│   │   └── business-units/  # Business unit components
│   ├── contexts/            # React contexts (Auth, etc.)
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── styles/              # Global styles
│   └── utils/               # Utility functions
├── index.html
├── vite.config.js
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Features by Business Unit

### Dashboard
- Overview statistics across all business units
- Revenue analytics and trends
- Recent activity feed
- Upcoming events calendar

### The Ring (Gym)
- Membership management
- Circuit queue monitoring
- Class scheduling
- Guest pass generation

### The Olive Room (Spa)
- Service bookings
- Therapist scheduling
- Progress photo management
- Tip processing

### The Edit Collection (Manufacturing)
- Batch production tracking
- Custom order management
- Returns processing
- Inventory integration

### Childcare
- Child registration
- Check-in/check-out management
- Activity logging
- Incident reporting

### Marketing (TWD)
- B2B client management
- Subscription tracking
- Content calendar

### Shared Services
- Voucher management
- Inventory control
- Accounting & settlements
- Kiosk monitoring
- Staff financial management
- Leaderboard system

## Design System

The dashboard uses the Women's Den brand colors:

- **Primary**: #23839b (Teal)
- **Primary Dark**: #1a6375
- **Accent**: #ebbf9a (Gold)
- **Business Unit Colors**:
  - Gym: #8b5cf6 (Purple)
  - Spa: #ec4899 (Pink)
  - Manufacturing: #f97316 (Orange)
  - Childcare: #14b8a6 (Teal)
  - Marketing: #6366f1 (Indigo)

## API Integration

The dashboard connects to the Women's Den backend API. See `API_DOCUMENTATION.md` in the project root for detailed endpoint documentation.

## 📚 Additional Documentation

- **[COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)** - Detailed completion summary of all implemented features
- **[USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** - Code examples and usage patterns for developers
- **[API_DOCUMENTATION.md](../API_DOCUMENTATION.md)** - Backend API documentation

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Contributing

This is a proprietary system for Women's Den. For internal development questions, contact the development team.

## 📄 License

Proprietary - Women's Den Business Ecosystem

---

**Version:** 1.0.0
**Last Updated:** January 2025
**Status:** ✅ Production Ready (Frontend)
