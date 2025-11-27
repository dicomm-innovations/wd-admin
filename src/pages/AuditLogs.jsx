import { useState, useEffect } from 'react';
import { Shield, Download, Eye, Calendar, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useNotification } from '../contexts/NotificationContext';
import { formatDate } from '../utils/formatters';
import { auditLogAPI } from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    businessUnit: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { error: showError, info } = useNotification();

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      };

      const response = await auditLogAPI.getAll(params);
      if (response && response.data) {
        setLogs(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      showError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
    info('Audit logs refreshed');
  };

  const handleExport = async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const blob = await auditLogAPI.export(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.csv`;
      a.click();
      info('Audit logs exported successfully');
    } catch (error) {
      console.error('Failed to export logs:', error);
      showError('Failed to export audit logs');
    }
  };

  const getActionBadge = (action) => {
    const variants = {
      create: 'success',
      read: 'info',
      update: 'warning',
      delete: 'danger',
      login: 'info',
      logout: 'secondary',
      approve: 'success',
      reject: 'danger'
    };
    return <Badge variant={variants[action] || 'secondary'}>{action.toUpperCase()}</Badge>;
  };

  const getBusinessUnitBadge = (bu) => {
    const variants = {
      gym: 'info',
      spa: 'warning',
      manufacturing: 'success',
      childcare: 'danger',
      marketing: 'secondary'
    };
    return <Badge variant={variants[bu] || 'secondary'}>{bu?.toUpperCase() || 'N/A'}</Badge>;
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      cell: (log) => <span className="text-sm">{formatDate(log.timestamp)}</span>
    },
    {
      header: 'Action',
      accessor: 'action',
      cell: (log) => getActionBadge(log.action)
    },
    {
      header: 'Entity Type',
      accessor: 'entityType',
      cell: (log) => <span className="text-sm">{log.entityType}</span>
    },
    {
      header: 'Performed By',
      accessor: 'performedBy',
      cell: (log) => (
        <div>
          <div className="text-sm">{log.performedBy?.firstName} {log.performedBy?.lastName}</div>
          <div className="text-xs text-gray-500">{log.performedBy?.employeeId}</div>
        </div>
      )
    },
    {
      header: 'Business Unit',
      accessor: 'businessUnit',
      cell: (log) => getBusinessUnitBadge(log.businessUnit)
    },
    {
      header: 'IP Address',
      accessor: 'ipAddress',
      cell: (log) => <span className="text-xs font-mono">{log.ipAddress || 'N/A'}</span>
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (log) => (
        <Button
          size="sm"
          variant="outline"
          icon={Eye}
          onClick={() => {
            setSelectedLog(log);
            setShowDetailModal(true);
          }}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <Layout title="Audit Logs" subtitle="System-wide activity tracking and monitoring">
      <div className="audit-logs-page">
        {/* Actions */}
        <Card>
          <div className="flex justify-between items-center">
            <Button
              icon={Download}
              variant="outline"
              onClick={handleExport}
            >
              Export Logs
            </Button>
            <Button
              icon={RefreshCw}
              variant="outline"
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Filters */}
        <Card title="Filters" icon={Calendar}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="input-field"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="read">Read</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>

            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="input-field"
            >
              <option value="">All Entities</option>
              <option value="Customer">Customer</option>
              <option value="Transaction">Transaction</option>
              <option value="Inventory">Inventory</option>
              <option value="Employee">Employee</option>
            </select>

            <select
              value={filters.businessUnit}
              onChange={(e) => setFilters({ ...filters, businessUnit: e.target.value })}
              className="input-field"
            >
              <option value="">All Units</option>
              <option value="gym">Gym</option>
              <option value="spa">Spa</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="childcare">Childcare</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input-field"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input-field"
              placeholder="End Date"
            />
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({
                  action: '',
                  entityType: '',
                  businessUnit: '',
                  startDate: '',
                  endDate: ''
                });
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Logs Table */}
        <Card title="Audit Trail" icon={Shield}>
          <Table
            columns={columns}
            data={logs}
            loading={loading}
            emptyMessage="No audit logs found"
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedLog(null);
            }}
            title="Audit Log Details"
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <div className="mt-1 text-sm">{formatDate(selectedLog.timestamp)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                  <div className="mt-1 text-sm">{selectedLog.entityType}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entity ID</label>
                  <div className="mt-1 text-sm font-mono">{selectedLog.entityId}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Performed By</label>
                  <div className="mt-1 text-sm">
                    {selectedLog.performedBy?.firstName} {selectedLog.performedBy?.lastName}
                    <div className="text-xs text-gray-500">{selectedLog.performedBy?.email}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Unit</label>
                  <div className="mt-1">{getBusinessUnitBadge(selectedLog.businessUnit)}</div>
                </div>
              </div>

              {selectedLog.changes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Changes</h3>
                  {selectedLog.changes.before && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Before</label>
                      <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto border border-red-200">
                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.changes.after && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">After</label>
                      <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto border border-green-200">
                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedLog(null);
                }}
              >
                Close
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default AuditLogs;
