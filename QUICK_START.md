# 🚀 Quick Start Guide

## Start the Dashboard in 3 Steps

### Step 1: Install Dependencies
```bash
cd admin
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Visit: **http://localhost:3003**

---

## 🎯 What You'll See

### Login Page
- Beautiful animated background
- Women's Den logo
- Email and password fields

### After Login: Dashboard
- 4 stat cards showing key metrics
- 3 interactive charts
- Recent activities feed
- Upcoming events calendar

---

## 🧭 Navigation

Click the sidebar menu items:

**Main Pages:**
- 📊 **Dashboard** - Overview and analytics
- 👥 **Customers** - Customer management with export
- 👔 **Employees** - Staff and commissions
- 🏋️ **Gym** - Memberships and circuit queue
- 📦 **Inventory** - Stock levels and alerts

**Try These Features:**
1. Search for customers
2. Click on a table row
3. Export customer data to CSV
4. View the circuit queue
5. Check inventory alerts

---

## 🎨 Features to Explore

### Customer Management
- Search customers by name/email/phone
- Click any row to see full details
- Export all customers to CSV
- View loyalty points

### Employee Management
- See commission earnings
- Track hours worked
- Filter by business unit
- View roles and positions

### Inventory
- Color-coded stock status:
  - 🟢 Green = In Stock
  - 🟡 Yellow = Low Stock
  - 🔴 Red = Out of Stock
- Total inventory value
- Reorder level alerts

### Gym Dashboard
- Real-time circuit queue
- Weekly sessions chart
- Membership tracking
- Queue wait times

---

## 📱 Mobile Friendly

Open on your phone to see:
- Responsive layout
- Touch-friendly buttons
- Scrollable tables
- Adaptive modals

---

## 🎯 What's Working

✅ All navigation links
✅ Search functionality
✅ Table pagination
✅ CSV export
✅ Modal pop-ups
✅ Charts and graphs
✅ Responsive design
✅ Smooth animations

---

## 🔐 Login Credentials

Use any employee account from your backend API.

**Create a test admin:**
```bash
curl -X POST http://localhost:5000/api/v1/employees/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@womensden.com",
    "password": "admin123",
    "businessUnit": "all",
    "role": "super_admin",
    "position": "Administrator"
  }'
```

Then login with:
- Email: admin@womensden.com
- Password: admin123

---

## 💡 Pro Tips

1. **Search is powerful** - Type anything to filter tables
2. **Click table rows** - Opens detailed modal
3. **Export button** - Downloads CSV instantly
4. **Sidebar collapse** - Click arrow to minimize
5. **Responsive** - Works on any device

---

## 🎨 Color Guide

Look for these colors:
- **Teal (#23839b)** - Primary/main actions
- **Gold (#ebbf9a)** - Accents/highlights
- **Purple** - Gym features
- **Pink** - Spa features
- **Orange** - Manufacturing features
- **Green** - Success/active status
- **Red** - Errors/alerts
- **Yellow** - Warnings/low stock

---

## 📊 Sample Data

The dashboard comes with mock data to demonstrate features:
- 3 sample customers
- 2 sample employees
- 3 sample inventory items
- 2 sample gym memberships
- 2 sample queue entries

**To use real data:**
Connect to your backend API (already integrated!)

---

## 🚀 Ready to Go!

Your admin dashboard is now running at:
**http://localhost:3003**

Enjoy managing your Women's Den business! 🎉

---

## 📚 More Help

See detailed documentation in:
- `COMPLETE_DASHBOARD_FEATURES.md` - Full feature list
- `GETTING_STARTED.md` - Detailed setup
- `API_DOCUMENTATION.md` - API reference
- `README.md` - Project overview

Happy administrating! ✨
