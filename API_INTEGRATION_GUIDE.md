# API Integration Guide

This guide provides step-by-step instructions for connecting the admin dashboard to real backend APIs.

## ✅ Completed Integrations

- **Dashboard** - Partially integrated with fallback to mock data

## 🔄 Integration Pattern

All page integrations should follow this consistent pattern for maintainability and reliability.

### Standard Integration Template

```jsx
import { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { formatDate, formatCurrency } from '../utils/formatters';
import { downloadCSV } from '../utils/exportHelpers';
import api from '../services/api';

const MyPage = () => {
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Hooks
  const { success, error: showError } = useNotification();
  const { connected, subscribe } = useWebSocket();

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribe('relevant:event', (eventData) => {
      // Handle real-time update
      setData(prev => updateData(prev, eventData));
    });

    return () => unsubscribe && unsubscribe();
  }, [connected, subscribe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/endpoint');
      setData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data');
      showError('Failed to load data');
      setLoading(false);

      // Optional: Load mock data as fallback
      setData(getMockData());
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCreate = async (formData) => {
    try {
      const response = await api.post('/endpoint', formData);
      setData([...data, response.data]);
      success('Created successfully!');
    } catch (err) {
      showError('Failed to create');
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      const response = await api.put(`/endpoint/${id}`, formData);
      setData(data.map(item => item.id === id ? response.data : item));
      success('Updated successfully!');
    } catch (err) {
      showError('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/endpoint/${id}`);
      setData(data.filter(item => item.id !== id));
      success('Deleted successfully!');
    } catch (err) {
      showError('Failed to delete');
    }
  };

  return (
    <Layout>
      {/* Your component JSX */}
    </Layout>
  );
};
```

---

## 📋 Page-by-Page Integration Checklist

### 1. Customers Page

**File:** `/admin/src/pages/Customers.jsx`

**API Endpoints:**
```javascript
// GET all customers
const response = await api.customerAPI.getAll({ page, limit, search });

// GET customer by ID
const response = await api.customerAPI.getById(customerId);

// GET customer profile summary
const response = await api.customerAPI.getProfileSummary(customerId);

// UPDATE customer
const response = await api.customerAPI.update(customerId, data);

// DELETE customer
await api.customerAPI.delete(customerId);
```

**WebSocket Events:**
- None specific (general updates through API refresh)

**Export Columns:**
```javascript
import { customerExportColumns } from '../utils/exportHelpers';
downloadCSV(customers, customerExportColumns, 'customers.csv');
```

**Steps:**
1. Replace mock `customers` array with API call to `/customers`
2. Add pagination support using API query params
3. Connect search functionality to API
4. Implement view/edit modal with real data
5. Add export functionality using existing utility

---

### 2. Employees Page

**File:** `/admin/src/pages/Employees.jsx`

**API Endpoints:**
```javascript
// GET all employees
const response = await api.employeeAPI.getAll({ businessUnit, role });

// GET employee by ID
const response = await api.employeeAPI.getById(employeeId);

// CREATE employee (super_admin only)
const response = await api.employeeAPI.create(employeeData);

// UPDATE employee
const response = await api.employeeAPI.update(employeeId, data);

// GET employee commissions
const response = await api.employeeAPI.getCommissions(employeeId, {
  month,
  year,
  paid
});

// GET employee timesheets
const response = await api.employeeAPI.getTimesheets(employeeId, {
  startDate,
  endDate
});
```

**WebSocket Events:**
- None specific

**Export Columns:**
```javascript
import { employeeExportColumns } from '../utils/exportHelpers';
downloadCSV(employees, employeeExportColumns, 'employees.csv');
```

**Steps:**
1. Replace mock employees data with API call
2. Add role-based filtering
3. Implement commission tracking display
4. Add timesheet view
5. Connect CRUD operations to API

---

### 3. Gym Page

**File:** `/admin/src/pages/Gym.jsx`

**API Endpoints:**
```javascript
// Memberships
const response = await api.gymAPI.getMemberships({ status, type });
const response = await api.gymAPI.createMembership(data);

// Circuit Queue
const response = await api.gymAPI.getCircuitQueue();
const response = await api.gymAPI.startCircuitSession(sessionId);
const response = await api.gymAPI.completeCircuitSession(sessionId);

// Classes
const response = await api.gymAPI.getClasses({ date });
const response = await api.gymAPI.bookClass(bookingData);

// Guest Passes
const response = await api.gymAPI.createGuestPass(membershipId, guestData);
const response = await api.gymAPI.validateGuestPass(passId);
```

**WebSocket Events:**
```javascript
const { subscribeToCircuitQueue } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribeToCircuitQueue((data) => {
    setCircuitQueue(data.queue);
  });
  return () => unsubscribe();
}, []);
```

**Steps:**
1. Connect membership list to API
2. Integrate real-time circuit queue updates
3. Add class booking functionality
4. Implement guest pass generation
5. Add membership creation/renewal

---

### 4. Spa Page

**File:** `/admin/src/pages/Spa.jsx`

**API Endpoints:**
```javascript
// Bookings
const response = await api.spaAPI.getBookings({ date, status, therapistId });
const response = await api.spaAPI.createBooking(bookingData);
const response = await api.spaAPI.updateBooking(bookingId, data);
const response = await api.spaAPI.startService(bookingId);
const response = await api.spaAPI.completeService(bookingId, completionData);

// Therapists
const response = await api.spaAPI.getTherapistSchedule(therapistId, date);

// Progress Photos
const response = await api.spaAPI.createProgressPhoto(formData);
const response = await api.spaAPI.getCustomerTimeline(customerId, {
  treatmentType,
  startDate,
  endDate
});
```

**WebSocket Events:**
```javascript
const { subscribeToBookingStatus } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribeToBookingStatus((data) => {
    if (data.businessUnit === 'spa') {
      // Update booking status
    }
  });
  return () => unsubscribe();
}, []);
```

**Steps:**
1. Connect booking list to API
2. Add therapist schedule view
3. Implement booking creation with service selection
4. Add progress photo upload functionality
5. Connect real-time booking updates

---

### 5. Manufacturing Page

**File:** `/admin/src/pages/Manufacturing.jsx`

**API Endpoints:**
```javascript
// Batches
const response = await api.manufacturingAPI.getBatches({ status });
const response = await api.manufacturingAPI.createBatch(batchData);
const response = await api.manufacturingAPI.startBatch(batchId);
const response = await api.manufacturingAPI.completeBatch(batchId, completionData);
const response = await api.manufacturingAPI.getBatchReport(batchId);

// Custom Orders
const response = await api.customOrderAPI.getOrders({ status, orderType });
const response = await api.customOrderAPI.createOrder(orderData);
const response = await api.customOrderAPI.processDeposit(orderId, depositData);
const response = await api.customOrderAPI.startProduction(orderId, batchId);

// Returns
const response = await api.returnAPI.getReturns({ status });
const response = await api.returnAPI.initiateReturn(returnData);
const response = await api.returnAPI.inspect(returnId, inspectionData);
const response = await api.returnAPI.processRefund(returnId, refundData);
```

**Steps:**
1. Connect batch list to API
2. Implement batch creation and production tracking
3. Add custom order management
4. Integrate returns processing
5. Add costing reports

---

### 6. Childcare Page

**File:** `/admin/src/pages/Childcare.jsx`

**API Endpoints:**
```javascript
// Children
const response = await api.childcareAPI.getChildren({ parentId });
const response = await api.childcareAPI.addChild(childData);
const response = await api.childcareAPI.updateChild(childId, data);

// Indemnity Forms
const response = await api.childcareAPI.getIndemnityForm(childId);
const response = await api.childcareAPI.signIndemnityForm(formData);

// Bookings
const response = await api.childcareAPI.getBookings({ date, status });
const response = await api.childcareAPI.checkin(bookingData);
const response = await api.childcareAPI.checkout(bookingId, checkoutData);

// Activities & Incidents
const response = await api.childcareAPI.logActivity(bookingId, activityData);
const response = await api.childcareAPI.logIncident(bookingId, incidentData);
```

**WebSocket Events:**
```javascript
const { subscribeToChildcareCheckin, subscribeToChildcareCheckout } = useWebSocket();

useEffect(() => {
  const unsubscribe1 = subscribeToChildcareCheckin((data) => {
    // Notify parent checked in child
  });

  const unsubscribe2 = subscribeToChildcareCheckout((data) => {
    // Notify parent checked out child
  });

  return () => {
    unsubscribe1();
    unsubscribe2();
  };
}, []);
```

**Steps:**
1. Connect children list to API
2. Implement check-in/check-out functionality
3. Add activity and incident logging
4. Show indemnity form status
5. Connect real-time notifications

---

### 7. Marketing Page

**File:** `/admin/src/pages/Marketing.jsx`

**API Endpoints:**
```javascript
// B2B Clients
const response = await api.marketingAPI.getClients({ status, industry });
const response = await api.marketingAPI.createClient(clientData);
const response = await api.marketingAPI.updateClient(clientId, data);

// Subscriptions
const response = await api.marketingAPI.getSubscriptions({ status });
const response = await api.marketingAPI.createSubscription(subscriptionData);
const response = await api.marketingAPI.renewSubscription(subscriptionId);

// Content Calendar
const response = await api.marketingAPI.getContentCalendar({
  clientId,
  startDate,
  endDate,
  status
});
const response = await api.marketingAPI.createContent(contentData);
const response = await api.marketingAPI.approveContent(contentId, feedback);
```

**Steps:**
1. Connect B2B client list to API
2. Add client creation/edit functionality
3. Implement subscription management
4. Add content calendar view
5. Integrate approval workflow

---

### 8. Vouchers Page

**File:** `/admin/src/pages/Vouchers.jsx`

**API Endpoints:**
```javascript
// Get vouchers
const response = await api.voucherAPI.getCustomerVouchers(customerId, {
  type,
  status
});

// Redeem voucher
const response = await api.voucherAPI.redeem({
  voucherCode,
  businessUnit,
  amount,
  bookingReference
});

// Get expiring vouchers
const response = await api.voucherAPI.getExpiringVouchers(days);

// Get voucher details
const response = await api.voucherAPI.getDetails(voucherCode);
```

**WebSocket Events:**
```javascript
const { subscribeToVoucherExpiring } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribeToVoucherExpiring((data) => {
    // Show expiry warning
  });
  return () => unsubscribe();
}, []);
```

**Steps:**
1. Connect voucher list to API
2. Add filtering by type and status
3. Implement redemption tracking
4. Show expiry alerts
5. Add voucher generation (if applicable)

---

### 9. Accounting Page

**File:** `/admin/src/pages/Accounting.jsx`

**API Endpoints:**
```javascript
// Ledger
const response = await api.accountingAPI.getLedger({
  fromBusiness,
  toBusiness,
  settled,
  month,
  year
});

// Settlements
const response = await api.accountingAPI.getSettlements({ month, year, status });
const response = await api.accountingAPI.getMonthlyReport(month, year);
const response = await api.accountingAPI.generateSettlement({ month, year });
```

**WebSocket Events:**
```javascript
const { subscribeToSettlementGenerated } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribeToSettlementGenerated((data) => {
    // Notify settlement generated
  });
  return () => unsubscribe();
}, []);
```

**Steps:**
1. Connect ledger entries to API
2. Add settlement list and details
3. Implement monthly report generation
4. Show settlement status
5. Add filtering and date range selection

---

### 10. Kiosk Page

**File:** `/admin/src/pages/Kiosk.jsx`

**API Endpoints:**
```javascript
// Device Management
const response = await api.kioskAnalyticsAPI.getSessions({
  startDate,
  endDate,
  location
});
const response = await api.kioskAnalyticsAPI.getAnalytics(kioskId, {
  startDate,
  endDate
});
const response = await api.kioskAnalyticsAPI.getUsageReport({
  startDate,
  endDate
});

// Promotions
const response = await api.kioskAPI.getPromotions({ active, businessUnit });
const response = await api.kioskAPI.createPromotion(promotionData);
const response = await api.kioskAPI.updatePromotion(promotionId, data);
const response = await api.kioskAPI.deletePromotion(promotionId);
```

**WebSocket Events:**
```javascript
const { subscribeToKioskStatus } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribeToKioskStatus((data) => {
    // Update kiosk status in real-time
  });
  return () => unsubscribe();
}, []);
```

**Steps:**
1. Connect device list to API
2. Show real-time device status
3. Add analytics dashboard
4. Implement promotion management
5. Add usage reports

---

### 11. Leaderboard Page

**File:** `/admin/src/pages/Leaderboard.jsx`

**API Endpoints:**
```javascript
// Member of the Month
const response = await api.leaderboardAPI.getMemberOfMonth({ month, year });

// Circuit Leaderboard
const response = await api.leaderboardAPI.getCircuitLeaderboard({
  limit,
  period
});

// Loyalty Leaderboard
const response = await api.leaderboardAPI.getLoyaltyLeaderboard({ limit });

// Customer Ranking
const response = await api.leaderboardAPI.getCustomerRanking(customerId);
```

**Steps:**
1. Connect leaderboard data to API
2. Add period filtering (week/month/all)
3. Show member achievements
4. Add search for specific customer
5. Display rankings with real data

---

### 12. Inventory Page

**File:** `/admin/src/pages/Inventory.jsx`

**API Endpoints:**
```javascript
// Items
const response = await api.inventoryAPI.getItems({
  category,
  location,
  status
});
const response = await api.inventoryAPI.getItem(itemId);
const response = await api.inventoryAPI.createItem(itemData);
const response = await api.inventoryAPI.updateItem(itemId, data);

// Stock Management
const response = await api.inventoryAPI.adjustStock(itemId, {
  adjustment,
  reason
});
const response = await api.inventoryAPI.transferStock(itemId, {
  toLocation,
  quantity
});

// Alerts
const response = await api.inventoryAPI.getLowStock();
const response = await api.inventoryAPI.getOutOfStock();
```

**WebSocket Events:**
```javascript
const { subscribeToInventoryLowStock } = useWebSocket();

useEffect(() => {
  const unsubscribe = subscribeToInventoryLowStock((data) => {
    // Show low stock alert
  });
  return () => unsubscribe();
}, []);
```

**Steps:**
1. Connect inventory list to API
2. Add CRUD operations
3. Implement stock adjustment functionality
4. Show low stock alerts in real-time
5. Add transfer between locations

---

## 🔧 Common Integration Tasks

### Error Handling Best Practices

```javascript
try {
  const response = await api.endpoint();
  // Success handling
} catch (err) {
  // Extract user-friendly error message
  const errorMessage = err.response?.data?.error || err.message || 'An error occurred';

  // Show to user
  showError(errorMessage);

  // Log for debugging
  console.error('API Error:', {
    endpoint: '/endpoint',
    error: err,
    response: err.response?.data
  });

  // Optional: Load fallback data
  setData(getFallbackData());
}
```

### Loading States

```javascript
// Show loading spinner
if (loading) {
  return (
    <Layout>
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    </Layout>
  );
}

// Or use skeleton loaders in StatCard
<StatCard {...stat} loading={loading} />
```

### Pagination

```javascript
const [page, setPage] = useState(1);
const [pageSize] = useState(10);
const [total, setTotal] = useState(0);

const fetchData = async () => {
  const response = await api.get('/endpoint', {
    params: { page, limit: pageSize }
  });

  setData(response.data.items);
  setTotal(response.data.total);
};

// In component
<Pagination
  currentPage={page}
  totalPages={Math.ceil(total / pageSize)}
  onPageChange={setPage}
/>
```

### Search Functionality

```javascript
import { debounce } from '../utils/helpers';

const [searchTerm, setSearchTerm] = useState('');

const debouncedSearch = useCallback(
  debounce(async (term) => {
    const response = await api.get('/endpoint', {
      params: { search: term }
    });
    setData(response.data);
  }, 500),
  []
);

const handleSearch = (e) => {
  const value = e.target.value;
  setSearchTerm(value);
  debouncedSearch(value);
};
```

---

## 🧪 Testing Your Integration

### Checklist for Each Page:

- [ ] Data loads correctly on page mount
- [ ] Loading states show while fetching
- [ ] Error states display user-friendly messages
- [ ] Real-time updates work (if applicable)
- [ ] CRUD operations function correctly
- [ ] Search/filter functionality works
- [ ] Pagination works correctly
- [ ] Export functionality works
- [ ] Notifications show for success/error
- [ ] Page refreshes data correctly

### Manual Testing Steps:

1. **Start backend server** - Ensure API is running
2. **Open browser console** - Watch for errors
3. **Navigate to page** - Verify data loads
4. **Test CRUD operations** - Create, edit, delete
5. **Test real-time** - Trigger WebSocket events
6. **Test error handling** - Disconnect backend
7. **Test export** - Export data to CSV
8. **Test on mobile** - Check responsive design

---

## 📖 Additional Resources

- **API Documentation**: See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- **Usage Examples**: See [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)
- **Utility Functions**: See [/admin/src/utils/](src/utils/)

---

## 🆘 Troubleshooting

### Common Issues:

**CORS Errors:**
- Ensure backend has proper CORS configuration
- Check `VITE_API_URL` in `.env` file

**Auth Errors (401):**
- Token might be expired
- Logout and login again
- Check token in localStorage

**Data Not Updating:**
- Clear browser cache
- Check WebSocket connection status
- Verify API endpoint in network tab

**TypeScript Errors:**
- Add proper types for API responses
- Use `any` temporarily if needed

---

**Last Updated:** January 2025
**Status:** Ready for Implementation
