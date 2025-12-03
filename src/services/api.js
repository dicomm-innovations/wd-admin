import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/employees/login', credentials),
  register: (data) => api.post('/employees/register', data),
  getProfile: (id) => api.get(`/employees/${id}`),
};

// Customer APIs
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getProfileSummary: (id) => api.get(`/customers/${id}/profile-summary`),
  getLoyaltyPoints: (id) => api.get(`/customers/${id}/loyalty-points`),
  getQRCode: (id) => api.get(`/customers/${id}/qr-code`),
};

// Gym APIs
export const gymAPI = {
  createMembership: (data) => api.post('/gym/memberships', data),
  getMemberships: (params) => api.get('/gym/memberships', { params }),
  getMembership: (id) => api.get(`/gym/memberships/${id}`),
  getQueueStatus: () => api.get('/gym/circuit/queue-status'),
  getCircuitStats: () => api.get('/gym/circuit/stats'),
  getCircuitQueue: () => api.get('/gym/circuit/queue-status'),
  joinQueue: (data) => api.post('/gym/circuit/join-queue', data),
  startCircuit: (sessionId) => api.post('/gym/circuit/start', { sessionId }),
  completeCircuit: (sessionId) => api.post('/gym/circuit/complete', { sessionId }),
  bookClass: (data) => api.post('/gym/classes/book', data),
  getClasses: (params) => api.get('/gym/classes', { params }),
  createClass: (data) => api.post('/gym/classes', data),
  updateClass: (id, data) => api.put(`/gym/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/gym/classes/${id}`),
  // Guest Pass APIs
  getAllGuestPasses: (params) => api.get('/gym/guest-passes', { params }),
  getMembershipGuestPasses: (membershipId) => api.get(`/gym/guest-passes/membership/${membershipId}`),
  getGuestPassById: (passId) => api.get(`/gym/guest-passes/guest-pass/${passId}`),
  createGuestPass: (data) => api.post('/gym/guest-passes/guest-pass/create', data),
  updateGuestPass: (passId, data) => api.put(`/gym/guest-passes/guest-pass/${passId}`, data),
  validateGuestPass: (passId) => api.post('/gym/guest-passes/guest-pass/validate', { passId }),
  checkGuestPassValidity: (passId) => api.get(`/gym/guest-passes/guest-pass/${passId}/check`),
  cancelGuestPass: (passId, reason) => api.post(`/gym/guest-passes/guest-pass/${passId}/cancel`, { reason }),
  getGuestPassSummary: () => api.get('/gym/guest-passes/summary'),
};

// Spa APIs
export const spaAPI = {
  createBooking: (data) => api.post('/spa/bookings', data),
  getBookings: (params) => api.get('/spa/bookings', { params }),
  getBooking: (id) => api.get(`/spa/bookings/${id}`),
  updateBooking: (id, data) => api.put(`/spa/bookings/${id}`, data),
  startService: (id) => api.post(`/spa/bookings/${id}/start`),
  completeService: (id, data) => api.post(`/spa/bookings/${id}/complete`, data),
  getProgressPhotos: (customerId, params) => api.get(`/spa/progress-photos/customer/${customerId}/timeline`, { params }),
  createProgressPhoto: (data) => api.post('/spa/progress-photos', data),
  processTip: (data) => api.post('/spa/tips/process', data),
};

// Progress Tracking APIs
export const progressAPI = {
  // Gym Progress
  uploadGymProgress: (data) => api.post('/progress/gym/upload', data),
  getGymProgress: (customerId, params) => api.get(`/progress/gym/customer/${customerId}`, { params }),
  compareGymProgress: (customerId, params) => api.get(`/progress/gym/customer/${customerId}/compare`, { params }),
  getGymAnalytics: (customerId) => api.get(`/progress/gym/customer/${customerId}/analytics`),

  // Spa Progress
  uploadSpaProgress: (data) => api.post('/progress/spa/upload', data),
  getSpaProgress: (customerId, params) => api.get(`/progress/spa/customer/${customerId}`, { params }),
  getSpaTimeline: (customerId, params) => api.get(`/progress/spa/customer/${customerId}/timeline`, { params }),
  getSpaAnalytics: (customerId, params) => api.get(`/progress/spa/customer/${customerId}/analytics`, { params }),
  getSpaComparison: (customerId, treatmentType) => api.get(`/progress/spa/customer/${customerId}/treatment/${treatmentType}/comparison`),

  // General
  getProgressGallery: (customerId, params) => api.get(`/progress/gallery/${customerId}`, { params }),
  getProgressSummary: (customerId) => api.get(`/progress/summary/${customerId}`),
  getMyProgress: (params) => api.get('/progress/my-progress', { params }),
  deleteProgress: (type, photoId) => api.delete(`/progress/${type}/${photoId}`),
  addGymComment: (photoId, data) => api.post(`/progress/gym/${photoId}/comment`, data),
  addSpaComment: (photoId, data) => api.post(`/progress/spa/${photoId}/comment`, data),
};

// Manufacturing APIs
export const manufacturingAPI = {
  createBatch: (data) => api.post('/manufacturing/batches', data),
  getBatches: (params) => api.get('/manufacturing/batches', { params }),
  getBatch: (id) => api.get(`/manufacturing/batches/${id}`),
  updateBatch: (id, data) => api.put(`/manufacturing/batches/${id}`, data),
  deleteBatch: (id) => api.delete(`/manufacturing/batches/${id}`),
  startBatch: (id) => api.post(`/manufacturing/batches/${id}/start`),
  completeBatch: (id, data) => api.post(`/manufacturing/batches/${id}/complete`, data),
  getBatchReport: (id) => api.get(`/manufacturing/batches/${id}/report`),
  createCustomOrder: (data) => api.post('/custom-orders', data),
  getCustomOrders: (params) => api.get('/custom-orders', { params }),
  processDeposit: (id, data) => api.post(`/custom-orders/${id}/deposit`, data),
  createReturn: (data) => api.post('/returns', data),
  getReturns: (params) => api.get('/returns', { params }),
  getReturnsAnalytics: (params) => api.get('/returns/analytics', { params }),
};

// Childcare APIs
export const childcareAPI = {
  addChild: (data) => api.post('/childcare/children', data),
  getChildren: (params) => api.get('/childcare/children', { params }),
  getChild: (id) => api.get(`/childcare/children/${id}`),
  updateChild: (id, data) => api.put(`/childcare/children/${id}`, data),
  createBooking: (data) => api.post('/childcare/bookings', data),
  getBookings: (params) => api.get('/childcare/bookings', { params }),
  getBooking: (id) => api.get(`/childcare/bookings/${id}`),
  checkout: (id, data) => api.post(`/childcare/bookings/${id}/checkout`, data),
  logActivity: (id, data) => api.post(`/childcare/bookings/${id}/activity`, data),
  logIncident: (id, data) => api.post(`/childcare/bookings/${id}/incident`, data),
  signIndemnity: (data) => api.post('/childcare/indemnity-forms', data),
  getIndemnityForm: (childId) => api.get(`/childcare/indemnity-forms/${childId}`),
};

// Marketing APIs
export const marketingAPI = {
  createClient: (data) => api.post('/marketing/clients', data),
  getClients: (params) => api.get('/marketing/clients', { params }),
  getB2BClients: (params) => api.get('/marketing/clients', { params }), // Alias for getClients
  getClient: (id) => api.get(`/marketing/clients/${id}`),
  updateClient: (id, data) => api.put(`/marketing/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/marketing/clients/${id}`),
  createSubscription: (data) => api.post('/marketing/subscriptions', data),
  getSubscription: (id) => api.get(`/marketing/subscriptions/${id}`),
  createContent: (data) => api.post('/marketing/content-calendar', data),
  getContent: (params) => api.get('/marketing/content-calendar', { params }),
  getContentCalendar: (params) => api.get('/marketing/content-calendar', { params }), // Alias for getContent
  getContentById: (id) => api.get(`/marketing/content-calendar/${id}`),
  updateContent: (id, data) => api.put(`/marketing/content-calendar/${id}`, data),
  deleteContent: (id) => api.delete(`/marketing/content-calendar/${id}`),
  approveContent: (id, data) => api.put(`/marketing/content-calendar/${id}/approve`, data),
};

// Voucher APIs
export const voucherAPI = {
  getAllVouchers: (params) => api.get('/vouchers', { params }),
  createVoucher: (data) => api.post('/vouchers', data),
  getCustomerVouchers: (customerId, params) => api.get(`/vouchers/customer/${customerId}`, { params }),
  redeemVoucher: (data) => api.post('/vouchers/redeem', data),
  getVoucherDetails: (code) => api.get(`/vouchers/details/${code}`),
  getExpiringVouchers: (params) => api.get('/vouchers/expiring', { params }),
  // Manual voucher generation
  manualGenerate: (data) => api.post('/vouchers/manual-generate', data),
  bulkGenerate: (data) => api.post('/vouchers/bulk-generate', data),
};

// Inventory APIs
export const inventoryAPI = {
  createItem: (data) => api.post('/inventory/items', data),
  getItems: (params) => api.get('/inventory/items', { params }),
  getItem: (id) => api.get(`/inventory/items/${id}`),
  updateItem: (id, data) => api.put(`/inventory/items/${id}`, data),
  deleteItem: (id) => api.delete(`/inventory/items/${id}`),
  adjustStock: (id, data) => api.post(`/inventory/items/${id}/adjust-stock`, data),
  transferStock: (id, data) => api.post(`/inventory/items/${id}/transfer`, data),
  getLowStockItems: () => api.get('/inventory/alerts/low-stock'),
  getOutOfStockItems: () => api.get('/inventory/alerts/out-of-stock'),
  uploadImages: (id, formData) => {
    return axios.post(`${API_BASE_URL}/inventory/items/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    }).then(res => res.data);
  },
  deleteImage: (itemId, imageId) => api.delete(`/inventory/items/${itemId}/images/${imageId}`),
  setPrimaryImage: (itemId, imageId) => api.put(`/inventory/items/${itemId}/images/${imageId}/primary`),
};

// Accounting APIs
export const accountingAPI = {
  getLedger: (params) => api.get('/accounting/ledger', { params }),
  getSettlements: (params) => api.get('/accounting/settlements', { params }),
  getMonthlySettlement: (month, year) => api.get(`/accounting/settlements/${month}/${year}`),
  generateSettlement: (data) => api.post('/accounting/settlements/generate', data),
  getExpenses: (params) => api.get('/accounting/expenses', { params }),
  createExpense: (data) => api.post('/accounting/expenses', data),
  updateExpense: (id, data) => api.put(`/accounting/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/accounting/expenses/${id}`),
  getFinancialSummary: (params) => api.get('/accounting/summary', { params }),
};

// Kiosk APIs
export const kioskAPI = {
  getDevices: (params) => api.get('/kiosk-analytics/devices', { params }),
  getAnalytics: (params) => api.get('/kiosk-analytics/analytics', { params }),
  getSessions: (params) => api.get('/kiosk-analytics/sessions', { params }),
  getKioskSessions: (id, params) => api.get(`/kiosk-analytics/sessions/${id}`, { params }),
  getKioskAnalytics: (id, params) => api.get(`/kiosk-analytics/analytics/${id}`, { params }),
  getUsageReport: (params) => api.get('/kiosk-analytics/usage-report', { params }),
  createPromotion: (data) => api.post('/kiosk-analytics/promotions', data),
  getPromotions: (params) => api.get('/kiosk-analytics/promotions', { params }),
  updatePromotion: (id, data) => api.put(`/kiosk-analytics/promotions/${id}`, data),
  deletePromotion: (id) => api.delete(`/kiosk-analytics/promotions/${id}`),
};

// Staff Transaction APIs
export const staffTransactionAPI = {
  createLoan: (data) => api.post('/staff-transactions/loans', data),
  createAdvance: (data) => api.post('/staff-transactions/advances', data),
  repayLoan: (id, data) => api.post(`/staff-transactions/loans/${id}/repay`, data),
  approveTransaction: (id) => api.post(`/staff-transactions/${id}/approve`),
  getEmployeeTransactions: (id, params) => api.get(`/staff-transactions/employee/${id}`, { params }),
  getPendingApprovals: () => api.get('/staff-transactions/pending-approvals'),
};

// Employee APIs
export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees/register', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getCommissions: (id, params) => api.get(`/employees/${id}/commissions`, { params }),
  getTimesheets: (id, params) => api.get(`/employees/${id}/timesheets`, { params }),
  clockIn: (id, data) => api.post(`/employees/${id}/clock-in`, data),
  clockOut: (id) => api.post(`/employees/${id}/clock-out`),
};

// Leaderboard APIs
export const leaderboardAPI = {
  getMemberOfMonth: (params) => api.get('/leaderboard/member-of-month', { params }),
  getCircuitLeaderboard: (params) => api.get('/leaderboard/circuit', { params }),
  getLoyaltyLeaderboard: (params) => api.get('/leaderboard/loyalty', { params }),
  getGymLeaderboard: (params) => api.get('/leaderboard/gym', { params }),
  getSpaLeaderboard: (params) => api.get('/leaderboard/spa', { params }),
  getAchievements: (params) => api.get('/leaderboard/achievements', { params }),
  getCustomerRanking: (id) => api.get(`/leaderboard/customer/${id}/ranking`),
};

// Chat APIs
export const chatAPI = {
  // Conversations
  getAllConversations: (params) => api.get('/chat/conversations', { params }),
  getUserConversations: (userId, params) => api.get(`/chat/conversations/user/${userId}`, { params }),
  getConversation: (conversationId) => api.get(`/chat/conversations/${conversationId}`),
  createConversation: (data) => api.post('/chat/conversations', data),
  updateConversation: (conversationId, data) => api.patch(`/chat/conversations/${conversationId}`, { data }),

  // Messages
  getMessages: (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
  markAsRead: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/read`, data),
  deleteMessage: (messageId, data) => api.delete(`/chat/messages/${messageId}`, { data }),

  // Search & Analytics
  searchMessages: (params) => api.get('/chat/messages/search', { params }),
  getAnalytics: (params) => api.get('/chat/analytics', { params }),
};

// Indemnity Forms APIs
export const indemnityAPI = {
  // General indemnity forms
  create: (data) => api.post('/indemnity-forms', data),
  getAll: (params) => api.get('/indemnity-forms', { params }),
  getById: (id) => api.get(`/indemnity-forms/${id}`),
  update: (id, data) => api.put(`/indemnity-forms/${id}`, data),
  delete: (id) => api.delete(`/indemnity-forms/${id}`),
  getByCustomer: (customerId, params) => api.get(`/indemnity-forms/customer/${customerId}`, { params }),
  getByServiceType: (serviceType, params) => api.get(`/indemnity-forms/service/${serviceType}`, { params }),
  revoke: (id, data) => api.post(`/indemnity-forms/${id}/revoke`, data),
  download: (id) => api.get(`/indemnity-forms/${id}/download`, { responseType: 'blob' }),

  // Service-specific convenience methods
  createGymForm: (data) => api.post('/indemnity-forms', { ...data, serviceType: 'gym' }),
  createGuestPassForm: (data) => api.post('/indemnity-forms', { ...data, serviceType: 'guest_pass' }),
  createChildcareForm: (data) => api.post('/indemnity-forms', { ...data, serviceType: 'childcare' }),
  createSpaForm: (data) => api.post('/indemnity-forms', { ...data, serviceType: 'spa' }),
};

// Notifications APIs
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getById: (id) => api.get(`/notifications/${id}`),
  create: (data) => api.post('/notifications', data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAllRead: () => api.delete('/notifications/read'),
  // Testing and management
  sendTest: (data) => api.post('/notifications/test', data),
  getStats: (params) => api.get('/notifications/stats', { params }),
  bulkSend: (data) => api.post('/notifications/bulk-send', data),
};

// Equipment Rental APIs
export const equipmentRentalAPI = {
  createRental: (data) => api.post('/gym/equipment/rent', data),
  getRentals: (params) => api.get('/gym/equipment/rentals', { params }),
  getRental: (id) => api.get(`/gym/equipment/rentals/${id}`),
  returnEquipment: (id, data) => api.post(`/gym/equipment/return/${id}`, data),
  extendRental: (id, data) => api.put(`/gym/equipment/rentals/${id}/extend`, data),
  reportLost: (id, data) => api.post(`/gym/equipment/rentals/${id}/report-lost`, data),
  getOverdueRentals: () => api.get('/gym/equipment/rentals/overdue'),
  getStatistics: () => api.get('/gym/equipment/rentals/stats'),
  getActiveRentals: () => api.get('/gym/equipment/rentals/active'),
};

// Supplier APIs
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getStatistics: () => api.get('/suppliers/statistics'),
  // Purchase Orders
  createPurchaseOrder: (data) => api.post('/suppliers/purchase-orders', data),
  getPurchaseOrders: (params) => api.get('/suppliers/purchase-orders', { params }),
  getPurchaseOrder: (id) => api.get(`/suppliers/purchase-orders/${id}`),
  approvePurchaseOrder: (id) => api.post(`/suppliers/purchase-orders/${id}/approve`),
  receivePurchaseOrder: (id, data) => api.post(`/suppliers/purchase-orders/${id}/receive`, data),
};

// Analytics APIs
export const analyticsAPI = {
  getExecutiveDashboard: (params) => api.get('/analytics/executive-dashboard', { params }),
  getFinancialReports: (params) => api.get('/analytics/financial-reports', { params }),
  getInventoryReports: (params) => api.get('/analytics/inventory-reports', { params }),
  getCustomerAnalytics: (params) => api.get('/analytics/customer-analytics', { params }),
  getEmployeePerformance: (params) => api.get('/analytics/employee-performance', { params }),
};

// Recipe Builder APIs
export const recipeAPI = {
  getAll: (params) => api.get('/manufacturing/recipes', { params }),
  getById: (id) => api.get(`/manufacturing/recipes/${id}`),
  create: (data) => api.post('/manufacturing/recipes', data),
  update: (id, data) => api.put(`/manufacturing/recipes/${id}`, data),
  delete: (id) => api.delete(`/manufacturing/recipes/${id}`),
  clone: (id) => api.post(`/manufacturing/recipes/${id}/clone`),
  calculateCost: (id) => api.get(`/manufacturing/recipes/${id}/calculate-cost`),
  checkAvailability: (id) => api.get(`/manufacturing/recipes/${id}/check-availability`),
};

// Audit Logs APIs
export const auditLogAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getById: (id) => api.get(`/audit-logs/${id}`),
  getByEntity: (entityType, entityId, params) => api.get(`/audit-logs/entity/${entityType}/${entityId}`, { params }),
  getByUser: (userId, params) => api.get(`/audit-logs/user/${userId}`, { params }),
  export: (params) => api.get('/audit-logs/export', { params, responseType: 'blob' }),
};

// Tester Product APIs
export const testerProductAPI = {
  getDistributions: (params) => api.get('/spa/tester-products', { params }),
  getDistribution: (id) => api.get(`/spa/tester-products/${id}`),
  createDistribution: (data) => api.post('/spa/tester-products', data),
  updateFeedback: (id, data) => api.put(`/spa/tester-products/${id}/feedback`, data),
  getStatistics: () => api.get('/spa/tester-products/statistics'),
  // Product Consumption
  getConsumptions: (params) => api.get('/spa/product-consumption', { params }),
  getConsumption: (id) => api.get(`/spa/product-consumption/${id}`),
  recordConsumption: (data) => api.post('/spa/product-consumption', data),
};

// Inter-Business Sales APIs
export const interBusinessSalesAPI = {
  getAll: (params) => api.get('/inter-business-sales', { params }),
  getById: (id) => api.get(`/inter-business-sales/${id}`),
  create: (data) => api.post('/inter-business-sales', data),
  getStatistics: () => api.get('/inter-business-sales/statistics'),
  getByBusinessUnit: (businessUnit, params) => api.get(`/inter-business-sales/business-unit/${businessUnit}`, { params }),
};

// SMS Monitoring APIs
export const smsMonitoringAPI = {
  getLogs: (params) => api.get('/sms-monitoring/logs', { params }),
  getStats: (params) => api.get('/sms-monitoring/stats', { params }),
  getConfig: () => api.get('/sms-monitoring/config'),
  sendTest: (data) => api.post('/sms-monitoring/test', data),
  getFailures: (params) => api.get('/sms-monitoring/failures', { params }),
  getCostAnalysis: (params) => api.get('/sms-monitoring/cost-analysis', { params }),
};

// Therapist Schedule Management APIs
export const therapistScheduleAPI = {
  getAllSchedules: (params) => api.get('/therapist-schedules/schedules', { params }),
  getScheduleById: (id) => api.get(`/therapist-schedules/schedules/${id}`),
  createSchedule: (data) => api.post('/therapist-schedules/schedules', data),
  updateSchedule: (id, data) => api.put(`/therapist-schedules/schedules/${id}`, data),
  // Therapists
  getAllTherapists: () => api.get('/therapist-schedules/therapists'),
  getAvailabilityCalendar: (therapistId, params) => api.get(`/therapist-schedules/therapists/${therapistId}/availability`, { params }),
  getAvailableSlots: (therapistId, params) => api.get(`/therapist-schedules/therapists/${therapistId}/slots`, { params }),
  // Time off
  addTimeOff: (therapistId, data) => api.post(`/therapist-schedules/therapists/${therapistId}/time-off`, data),
  updateTimeOffStatus: (scheduleId, timeOffId, data) => api.put(`/therapist-schedules/schedules/${scheduleId}/time-off/${timeOffId}`, data),
  // Exceptions
  addException: (therapistId, data) => api.post(`/therapist-schedules/therapists/${therapistId}/exceptions`, data),
};

// Treatment Management APIs
export const treatmentManagementAPI = {
  getAllTreatments: (params) => api.get('/spa-treatments/treatments', { params }),
  getTreatmentById: (id) => api.get(`/spa-treatments/treatments/${id}`),
  createTreatment: (data) => api.post('/spa-treatments/treatments', data),
  updateTreatment: (id, data) => api.put(`/spa-treatments/treatments/${id}`, data),
  deleteTreatment: (id) => api.delete(`/spa-treatments/treatments/${id}`),
  // Query and search
  getTreatmentsByCategory: (category) => api.get(`/spa-treatments/treatments/category/${category}`),
  getPopularTreatments: (params) => api.get('/spa-treatments/treatments/popular', { params }),
  searchTreatments: (params) => api.get('/spa-treatments/treatments/search', { params }),
  getCategories: () => api.get('/spa-treatments/treatments/categories'),
  getTreatmentStats: () => api.get('/spa-treatments/treatments/stats'),
  // Bulk operations
  duplicateTreatment: (id) => api.post(`/spa-treatments/treatments/${id}/duplicate`),
  bulkUpdateStatus: (data) => api.post('/spa-treatments/treatments/bulk-update-status', data),
};

// PT (Personal Training) Admin APIs
export const ptAdminAPI = {
  // Trainer Management
  getTrainersWithStats: (params) => api.get('/pt/admin/trainers', { params }),
  createTrainer: (data) => api.post('/pt/admin/trainers', data),
  updateTrainer: (id, data) => api.put(`/pt/admin/trainers/${id}`, data),
  getTrainerSchedule: (id, params) => api.get(`/pt/admin/trainers/${id}/schedule`, { params }),

  // Session Management
  getAllSessions: (params) => api.get('/pt/admin/sessions', { params }),
  createManualBooking: (data) => api.post('/pt/admin/sessions', data),
  updateSessionStatus: (id, data) => api.put(`/pt/admin/sessions/${id}/status`, data),

  // Analytics
  getPTAnalytics: (params) => api.get('/pt/admin/analytics', { params }),
};

// Referral System Admin APIs
export const referralAdminAPI = {
  // Referral Management
  getAllReferrals: (params) => api.get('/referrals/admin/referrals', { params }),
  getReferralDetails: (id) => api.get(`/referrals/admin/referrals/${id}`),
  processReferral: (id, data) => api.post(`/referrals/admin/referrals/${id}/process`, data),

  // Referral Analytics
  getReferralAnalytics: (params) => api.get('/referrals/admin/analytics', { params }),

  // Incentive Program Management
  getAllIncentives: (params) => api.get('/referrals/admin/incentives', { params }),
  createIncentive: (data) => api.post('/referrals/admin/incentives', data),
  updateIncentive: (id, data) => api.put(`/referrals/admin/incentives/${id}`, data),
  deleteIncentive: (id) => api.delete(`/referrals/admin/incentives/${id}`),
  getIncentivePerformance: (id) => api.get(`/referrals/admin/incentives/${id}/performance`),
};

// Payment Records APIs
export const paymentRecordsAPI = {
  // Payment Management
  recordPayment: (data) => api.post('/payment-records', data),
  getAll: (params) => api.get('/payment-records', { params }),
  getById: (id) => api.get(`/payment-records/${id}`),
  getCustomerHistory: (customerId, params) => api.get(`/payment-records/customer/${customerId}/history`, { params }),

  // Receipt Management
  generateReceipt: (id) => api.post(`/payment-records/${id}/receipt/generate`),
  emailReceipt: (id) => api.post(`/payment-records/${id}/receipt/email`),
  downloadReceipt: (id) => api.get(`/payment-records/${id}/receipt/download`, { responseType: 'blob' }),

  // Refund Management
  processRefund: (id, data) => api.post(`/payment-records/${id}/refund`, data),

  // Analytics
  getSummary: (params) => api.get('/payment-records/analytics/summary', { params }),
  getRevenueByUnit: (params) => api.get('/payment-records/analytics/revenue-by-unit', { params }),

  // Customer Account Management
  getCustomerAccount: (customerId) => api.get(`/payment-records/customer/${customerId}/account`),
  addCredit: (customerId, data) => api.post(`/payment-records/customer/${customerId}/credit`, data),
  debitAccount: (customerId, data) => api.post(`/payment-records/customer/${customerId}/debit`, data),
  getStatement: (customerId, params) => api.get(`/payment-records/customer/${customerId}/statement`, { params }),
  getTransactions: (customerId, params) => api.get(`/payment-records/customer/${customerId}/transactions`, { params }),
};

// Revenue Analytics APIs
export const revenueAPI = {
  // Comprehensive Revenue Reports
  getComprehensive: (params) => api.get('/revenue/comprehensive', { params }),
  getByBusinessUnit: (params) => api.get('/revenue/by-business-unit', { params }),

  // Trends and Analytics
  getTrend: (params) => api.get('/revenue/trend', { params }),
  getPaymentMethods: (params) => api.get('/revenue/payment-methods', { params }),
  getTopCustomers: (params) => api.get('/revenue/top-customers', { params }),

  // Period-based Reports
  getDaily: (params) => api.get('/revenue/daily', { params }),
  getMonthly: (params) => api.get('/revenue/monthly', { params }),
  getYearly: (params) => api.get('/revenue/yearly', { params }),

  // Forecasting
  getForecast: (params) => api.get('/revenue/forecast', { params }),
};

export default api;
