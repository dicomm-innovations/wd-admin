# Usage Examples - Admin Dashboard

This guide provides practical examples of how to use the new features in your components.

---

## 🔌 WebSocket Real-Time Updates

### Basic Usage

```jsx
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';

const CircuitQueue = () => {
  const { subscribeToCircuitQueue, connected } = useWebSocket();
  const { info } = useNotification();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    // Subscribe to circuit queue updates
    const unsubscribe = subscribeToCircuitQueue((data) => {
      console.log('Queue updated:', data);
      setQueue(data.queue);
      info('Circuit queue updated!', 3000);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, [subscribeToCircuitQueue]);

  return (
    <div>
      <h2>Circuit Queue {connected ? '🟢' : '🔴'}</h2>
      {/* Render queue */}
    </div>
  );
};
```

### Multiple Event Subscriptions

```jsx
const Dashboard = () => {
  const { subscribe } = useWebSocket();
  const { warning, info } = useNotification();

  useEffect(() => {
    // Subscribe to multiple events
    const unsubscribers = [
      subscribe('inventory:low_stock', (data) => {
        warning(`Low stock alert: ${data.itemName}`);
      }),
      subscribe('voucher:expiring', (data) => {
        info(`Voucher expiring soon: ${data.voucherCode}`);
      }),
      subscribe('kiosk:status', (data) => {
        if (data.status === 'offline') {
          warning(`Kiosk ${data.deviceId} went offline`);
        }
      })
    ];

    // Cleanup all subscriptions
    return () => {
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [subscribe, warning, info]);

  return <div>Dashboard Content</div>;
};
```

### Joining Business Unit Rooms

```jsx
const SpaManagement = () => {
  const { joinRoom, leaveRoom, subscribeToBookingStatus } = useWebSocket();
  const { success } = useNotification();

  useEffect(() => {
    // Join spa-specific room for targeted updates
    joinRoom('spa');

    const unsubscribe = subscribeToBookingStatus((data) => {
      if (data.businessUnit === 'spa') {
        success(`Booking ${data.bookingId} updated: ${data.status}`);
      }
    });

    return () => {
      leaveRoom('spa');
      unsubscribe();
    };
  }, [joinRoom, leaveRoom, subscribeToBookingStatus]);

  return <div>Spa Management</div>;
};
```

---

## 🔔 Toast Notifications

### Basic Notifications

```jsx
import { useNotification } from '../contexts/NotificationContext';

const CustomerForm = () => {
  const { success, error, warning, info } = useNotification();

  const handleSubmit = async (data) => {
    try {
      await api.createCustomer(data);
      success('Customer created successfully!');
      navigate('/customers');
    } catch (err) {
      error('Failed to create customer. Please try again.');
    }
  };

  const handleWarning = () => {
    warning('This action cannot be undone!', 8000); // 8 second duration
  };

  const handleInfo = () => {
    info('Loading customer data...', 0); // No auto-dismiss
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Notification with Custom Duration

```jsx
const ImportData = () => {
  const { success, info } = useNotification();

  const handleImport = async (file) => {
    info('Importing data, please wait...', 0); // Persistent notification

    try {
      await api.importData(file);
      success('Import completed successfully!', 10000); // 10 seconds
    } catch (err) {
      error('Import failed', 10000);
    }
  };

  return <button onClick={handleImport}>Import</button>;
};
```

---

## 📊 Export Data Examples

### Export to CSV

```jsx
import { downloadCSV } from '../utils/exportHelpers';
import { formatDate, formatCurrency } from '../utils/formatters';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);

  const handleExport = () => {
    const columns = [
      { key: 'customerId', label: 'Customer ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      {
        key: 'loyaltyPoints',
        label: 'Loyalty Points',
        formatter: (row) => row.loyaltyPoints.toLocaleString()
      },
      {
        key: 'createdAt',
        label: 'Registration Date',
        formatter: (row) => formatDate(row.createdAt)
      }
    ];

    downloadCSV(customers, columns, 'customers_export.csv');
  };

  return (
    <div>
      <button onClick={handleExport}>Export to CSV</button>
      {/* Customer table */}
    </div>
  );
};
```

### Export with Preset Columns

```jsx
import { downloadExcelCSV, customerExportColumns } from '../utils/exportHelpers';

const QuickExport = () => {
  const [customers, setCustomers] = useState([]);

  const handleQuickExport = () => {
    // Use preset columns for common exports
    downloadExcelCSV(customers, customerExportColumns, 'customers.csv');
  };

  return <button onClick={handleQuickExport}>Quick Export</button>;
};
```

### Universal Export Function

```jsx
import { exportData } from '../utils/exportHelpers';

const DataTable = ({ data, columns }) => {
  const [exportFormat, setExportFormat] = useState('csv');

  const handleExport = async () => {
    try {
      await exportData(
        data,
        columns,
        exportFormat, // 'csv', 'excel', 'json', 'pdf', 'print'
        'my_export',
        'My Data Export'
      );
      success(`Exported as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      error('Export failed');
    }
  };

  return (
    <div>
      <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
        <option value="csv">CSV</option>
        <option value="excel">Excel</option>
        <option value="json">JSON</option>
        <option value="pdf">PDF</option>
        <option value="print">Print</option>
      </select>
      <button onClick={handleExport}>Export</button>
    </div>
  );
};
```

---

## 🎨 Formatting Examples

### Date Formatting

```jsx
import { formatDate, formatDateShort, formatRelativeTime } from '../utils';

const BookingCard = ({ booking }) => {
  return (
    <div>
      <p>Booking Date: {formatDateShort(booking.bookingDate)}</p>
      <p>Created: {formatRelativeTime(booking.createdAt)}</p>
      <p>Full Date: {formatDate(booking.bookingDate, 'MMMM dd, yyyy')}</p>
    </div>
  );
};
```

### Currency Formatting

```jsx
import { formatCurrency, formatCurrencyCompact } from '../utils';

const InvoiceTotal = ({ amount, largeAmount }) => {
  return (
    <div>
      <p>Total: {formatCurrency(amount, 'USD')}</p>
      <p>Revenue: {formatCurrencyCompact(largeAmount)}</p>
      {/* Example output: $1.2M */}
    </div>
  );
};
```

### Status Badge

```jsx
import { getStatusVariant, formatStatus } from '../utils';
import Badge from '../components/common/Badge';

const OrderStatus = ({ status }) => {
  return (
    <Badge variant={getStatusVariant(status)}>
      {formatStatus(status)}
    </Badge>
  );
};

// Example:
// status = 'in_progress' -> Badge color: warning, Text: "In Progress"
// status = 'completed' -> Badge color: success, Text: "Completed"
```

### Multiple Formatters

```jsx
import {
  formatName,
  formatPhoneNumber,
  formatCurrency,
  formatDate
} from '../utils';

const CustomerProfile = ({ customer }) => {
  return (
    <div>
      <h2>{formatName(customer.firstName, customer.lastName)}</h2>
      <p>Phone: {formatPhoneNumber(customer.phone)}</p>
      <p>Loyalty Points: {customer.loyaltyPoints.toLocaleString()}</p>
      <p>Member Since: {formatDate(customer.createdAt, 'MMMM yyyy')}</p>
    </div>
  );
};
```

---

## 🔍 Search and Filter

### Debounced Search

```jsx
import { debounce, filterBySearch } from '../utils';
import { useState, useMemo, useCallback } from 'react';

const CustomerSearch = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(customers);

  // Debounce search to avoid excessive filtering
  const debouncedSearch = useCallback(
    debounce((term) => {
      const searchKeys = ['firstName', 'lastName', 'email', 'phone'];
      const results = filterBySearch(customers, term, searchKeys);
      setFilteredData(results);
    }, 300),
    [customers]
  );

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search customers..."
      />
      {/* Render filteredData */}
    </div>
  );
};
```

### Sort and Group Data

```jsx
import { sortBy, groupBy } from '../utils';

const EmployeeList = ({ employees }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'firstName', order: 'asc' });

  const sortedEmployees = useMemo(() => {
    return sortBy(employees, sortConfig.key, sortConfig.order);
  }, [employees, sortConfig]);

  const groupedByUnit = useMemo(() => {
    return groupBy(sortedEmployees, 'businessUnit');
  }, [sortedEmployees]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div>
      <button onClick={() => handleSort('firstName')}>Sort by Name</button>
      <button onClick={() => handleSort('position')}>Sort by Position</button>

      {Object.entries(groupedByUnit).map(([unit, empList]) => (
        <div key={unit}>
          <h3>{unit}</h3>
          {/* Render employees in this unit */}
        </div>
      ))}
    </div>
  );
};
```

---

## 📄 Pagination Example

```jsx
import { paginate } from '../utils';
import { useState } from 'react';

const PaginatedTable = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const paginatedData = useMemo(() => {
    return paginate(data, currentPage, pageSize);
  }, [data, currentPage, pageSize]);

  return (
    <div>
      <table>
        {/* Render paginatedData.data */}
      </table>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
        >
          Previous
        </button>

        <span>
          Page {paginatedData.page} of {paginatedData.totalPages}
        </span>

        <button
          disabled={currentPage === paginatedData.totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
        >
          Next
        </button>
      </div>

      <p>Showing {paginatedData.data.length} of {paginatedData.total} items</p>
    </div>
  );
};
```

---

## 💾 Local Storage Usage

```jsx
import { storage } from '../utils';

const UserPreferences = () => {
  const [theme, setTheme] = useState(() => storage.get('theme', 'light'));

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    storage.set('theme', newTheme);
  };

  useEffect(() => {
    // Load preferences on mount
    const savedTheme = storage.get('theme', 'light');
    setTheme(savedTheme);
  }, []);

  return (
    <div>
      <button onClick={() => handleThemeChange('light')}>Light</button>
      <button onClick={() => handleThemeChange('dark')}>Dark</button>
    </div>
  );
};
```

---

## 🎯 Business Unit Helpers

```jsx
import { getBusinessUnitColor, getBusinessUnitIcon, formatBusinessUnit } from '../utils';

const BusinessUnitBadge = ({ unit }) => {
  const color = getBusinessUnitColor(unit);
  const icon = getBusinessUnitIcon(unit);
  const name = formatBusinessUnit(unit);

  return (
    <div style={{
      backgroundColor: color,
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px'
    }}>
      {icon} {name}
    </div>
  );
};

// Example output:
// gym -> 💪 The Ring (purple background)
// spa -> 🌸 The Olive Room (pink background)
```

---

## 🔄 Retry Logic for API Calls

```jsx
import { retryAsync } from '../utils';
import { useNotification } from '../contexts/NotificationContext';

const DataFetcher = () => {
  const { error, success } = useNotification();
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const result = await retryAsync(
        () => api.fetchImportantData(),
        3, // 3 retries
        1000 // 1 second initial delay
      );
      setData(result);
      success('Data loaded successfully');
    } catch (err) {
      error('Failed to load data after 3 attempts');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>{data ? 'Data loaded' : 'Loading...'}</div>;
};
```

---

## 🎨 Complete Form Example with All Features

```jsx
import { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate, isValidEmail, isValidPhone } from '../utils';
import { downloadCSV } from '../utils/exportHelpers';

const CustomerManagement = () => {
  const { success, error, warning } = useNotification();
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = 'Required';
    if (!formData.email) {
      newErrors.email = 'Required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.phone) {
      newErrors.phone = 'Required';
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Invalid phone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      warning('Please fix form errors');
      return;
    }

    try {
      const result = await api.createCustomer(formData);
      setCustomers([...customers, result]);
      success('Customer created successfully!');
      setFormData({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (err) {
      error('Failed to create customer');
    }
  };

  const handleExport = () => {
    const columns = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      {
        key: 'createdAt',
        label: 'Created',
        formatter: (row) => formatDate(row.createdAt)
      }
    ];

    downloadCSV(customers, columns, `customers_${formatDate(new Date(), 'yyyyMMdd')}.csv`);
    success('Customers exported successfully!');
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          placeholder="First Name"
        />
        {errors.firstName && <span className="error">{errors.firstName}</span>}

        <input
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Email"
        />
        {errors.email && <span className="error">{errors.email}</span>}

        <button type="submit">Create Customer</button>
      </form>

      <button onClick={handleExport}>Export Customers</button>

      {/* Customer list */}
    </div>
  );
};
```

---

## 📱 Mobile Detection

```jsx
import { isMobile } from '../utils';

const ResponsiveComponent = () => {
  const mobile = isMobile();

  return (
    <div>
      {mobile ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </div>
  );
};
```

---

These examples should cover most common use cases! Mix and match as needed for your specific requirements.
