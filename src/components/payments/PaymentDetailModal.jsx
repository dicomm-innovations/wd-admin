import { Mail, Download, Receipt, DollarSign, CheckCircle, Clock, XCircle, CreditCard, Printer } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import logo from '../../assets/logo.png';

const PaymentDetailModal = ({ isOpen, onClose, payment, onEmailReceipt, onDownloadReceipt }) => {
  if (!payment) return null;

  const getBusinessUnitName = (unit) => {
    const names = {
      gym: 'The Ring - Fitness Center',
      spa: 'The Olive Room - Wellness Spa',
      manufacturing: 'The Edit Collection',
      childcare: "The Women's Den - Childcare",
      marketing: 'TWD Marketing'
    };
    return names[unit] || unit;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'success', label: 'Completed' },
      pending: { variant: 'warning', label: 'Pending' },
      cancelled: { variant: 'gray', label: 'Cancelled' },
      refunded: { variant: 'danger', label: 'Refunded' },
      partially_refunded: { variant: 'warning', label: 'Partially Refunded' }
    };

    const config = statusConfig[status] || { variant: 'gray', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle style={{ color: '#10b981', width: '24px', height: '24px' }} />,
      pending: <Clock style={{ color: '#f59e0b', width: '24px', height: '24px' }} />,
      cancelled: <XCircle style={{ color: '#6b7280', width: '24px', height: '24px' }} />,
      refunded: <XCircle style={{ color: '#ef4444', width: '24px', height: '24px' }} />
    };
    return icons[status] || icons.pending;
  };

  const handleDownloadPDF = () => {
    // Open receipt in new window with download prompt
    const printWindow = window.open('', '_blank');
    const receiptHTML = generateReceiptHTML(true);

    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Trigger print dialog which allows "Save as PDF"
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    const receiptHTML = generateReceiptHTML(false);

    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const generateReceiptHTML = (forDownload = false) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt - ${payment.receiptNumber || payment.paymentNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #ffffff;
              padding: 40px;
              color: #1f2937;
            }

            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }

            .receipt-header {
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
              position: relative;
              overflow: hidden;
            }

            .receipt-header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            }

            .logo-container {
              margin-bottom: 20px;
              position: relative;
              z-index: 1;
            }

            .logo {
              width: 80px;
              height: 80px;
              background: white;
              border-radius: 50%;
              padding: 12px;
              margin: 0 auto;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .logo img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            .company-name {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
              position: relative;
              z-index: 1;
            }

            .business-unit {
              font-size: 18px;
              color: rgba(255, 255, 255, 0.95);
              margin-bottom: 24px;
              font-weight: 500;
              position: relative;
              z-index: 1;
            }

            .receipt-badge {
              display: inline-block;
              background: rgba(255, 255, 255, 0.2);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.3);
              padding: 16px 24px;
              border-radius: 12px;
              position: relative;
              z-index: 1;
            }

            .receipt-number {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 6px;
              letter-spacing: 1px;
            }

            .receipt-date {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.9);
            }

            .receipt-body {
              padding: 40px 30px;
            }

            .section {
              margin-bottom: 32px;
            }

            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #374151;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
              display: flex;
              align-items: center;
              gap: 8px;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              background: #f9fafb;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            }

            .info-item {
              display: flex;
              flex-direction: column;
            }

            .info-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }

            .info-value {
              font-size: 15px;
              color: #111827;
              font-weight: 600;
            }

            .items-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              overflow: hidden;
            }

            .items-table thead {
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
              color: white;
            }

            .items-table th {
              padding: 14px 16px;
              text-align: left;
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .items-table th:last-child,
            .items-table td:last-child {
              text-align: right;
            }

            .items-table tbody tr {
              border-bottom: 1px solid #e5e7eb;
              transition: background 0.2s;
            }

            .items-table tbody tr:last-child {
              border-bottom: none;
            }

            .items-table tbody tr:hover {
              background: #f9fafb;
            }

            .items-table td {
              padding: 14px 16px;
              font-size: 14px;
              color: #374151;
            }

            .item-description {
              font-weight: 600;
              color: #111827;
            }

            .totals-section {
              background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%);
              padding: 24px;
              border-radius: 12px;
              border: 2px solid #e9d5ff;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              font-size: 15px;
              color: #374151;
            }

            .total-row.divider {
              border-top: 1px solid #c4b5fd;
              margin-top: 8px;
              padding-top: 16px;
            }

            .total-row.grand-total {
              border-top: 2px solid #8b5cf6;
              margin-top: 12px;
              padding-top: 16px;
              font-size: 20px;
              font-weight: 700;
              color: #6b21a8;
            }

            .total-label {
              font-weight: 600;
            }

            .total-value {
              font-weight: 700;
            }

            .discount-value {
              color: #059669;
            }

            .payment-method-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: #f3f4f6;
              padding: 12px 20px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              font-weight: 600;
              color: #374151;
            }

            .split-payment-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 16px;
              background: white;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              margin-bottom: 8px;
            }

            .split-method {
              font-weight: 600;
              color: #374151;
              text-transform: capitalize;
            }

            .split-amount {
              font-weight: 700;
              color: #6b21a8;
            }

            .split-reference {
              font-size: 12px;
              color: #6b7280;
              margin-top: 4px;
            }

            .notes-section {
              background: #fef3c7;
              border: 1px solid #fde047;
              border-left: 4px solid #eab308;
              padding: 16px;
              border-radius: 8px;
              color: #854d0e;
            }

            .notes-title {
              font-weight: 700;
              margin-bottom: 8px;
              color: #713f12;
            }

            .status-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
            }

            .status-completed {
              background: #d1fae5;
              color: #065f46;
              border: 1px solid #6ee7b7;
            }

            .status-pending {
              background: #fef3c7;
              color: #92400e;
              border: 1px solid #fde047;
            }

            .status-refunded {
              background: #fee2e2;
              color: #991b1b;
              border: 1px solid #fca5a5;
            }

            .receipt-footer {
              background: #f9fafb;
              padding: 32px;
              text-align: center;
              border-top: 2px solid #e5e7eb;
            }

            .footer-message {
              font-size: 16px;
              font-weight: 600;
              color: #6b21a8;
              margin-bottom: 12px;
            }

            .footer-tagline {
              font-size: 13px;
              color: #6b7280;
              font-style: italic;
              margin-bottom: 16px;
            }

            .footer-contact {
              font-size: 12px;
              color: #9ca3af;
              line-height: 1.6;
            }

            .watermark {
              position: fixed;
              bottom: 20px;
              right: 20px;
              font-size: 10px;
              color: #d1d5db;
              font-style: italic;
            }

            @media print {
              body {
                padding: 0;
              }

              .receipt-container {
                box-shadow: none;
                border: none;
              }

              .watermark {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <!-- Header -->
            <div class="receipt-header">
              <div class="logo-container">
                <div class="logo">
                  <img src="${logo}" alt="Women's Den Logo" />
                </div>
              </div>
              <div class="company-name">WOMEN'S DEN</div>
              <div class="business-unit">${getBusinessUnitName(payment.businessUnit)}</div>
              <div class="receipt-badge">
                <div class="receipt-number">${payment.receiptNumber || payment.paymentNumber}</div>
                <div class="receipt-date">${format(new Date(payment.paymentDate), 'MMMM dd, yyyy - HH:mm')}</div>
              </div>
            </div>

            <!-- Body -->
            <div class="receipt-body">
              <!-- Payment Information -->
              <div class="section">
                <div class="section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Payment Information
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Customer Name</div>
                    <div class="info-value">${payment.customer?.firstName} ${payment.customer?.lastName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Type</div>
                    <div class="info-value" style="text-transform: capitalize;">${payment.paymentType.replace('_', ' ')}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value" style="font-size: 13px;">${payment.customer?.email || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${payment.customer?.phone || 'N/A'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value">
                      <span class="status-badge status-${payment.status.replace('_', '-')}">
                        ${payment.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Processed By</div>
                    <div class="info-value">${payment.processedBy?.firstName} ${payment.processedBy?.lastName}</div>
                  </div>
                </div>
                ${payment.description ? `
                  <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 8px; border-left: 3px solid #8b5cf6;">
                    <div class="info-label" style="margin-bottom: 6px;">Description</div>
                    <div style="color: #374151; font-size: 14px;">${payment.description}</div>
                  </div>
                ` : ''}
              </div>

              <!-- Items -->
              <div class="section">
                <div class="section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  Items
                </div>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Unit Price</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${payment.items.map(item => `
                      <tr>
                        <td class="item-description">${item.description}</td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
                        <td style="text-align: right; font-weight: 700; color: #6b21a8;">${formatCurrency(item.totalPrice)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Totals -->
              <div class="section">
                <div class="totals-section">
                  <div class="total-row">
                    <span class="total-label">Subtotal:</span>
                    <span class="total-value">${formatCurrency(payment.subtotal)}</span>
                  </div>

                  ${payment.discount > 0 ? `
                    <div class="total-row">
                      <span class="total-label">
                        Discount ${payment.discountReason ? `(${payment.discountReason})` : ''}:
                      </span>
                      <span class="total-value discount-value">-${formatCurrency(payment.discount)}</span>
                    </div>
                  ` : ''}

                  ${payment.tax > 0 ? `
                    <div class="total-row">
                      <span class="total-label">Tax (${payment.taxRate}%):</span>
                      <span class="total-value">${formatCurrency(payment.tax)}</span>
                    </div>
                  ` : ''}

                  <div class="total-row grand-total">
                    <span class="total-label">TOTAL AMOUNT:</span>
                    <span class="total-value">${formatCurrency(payment.totalAmount)}</span>
                  </div>

                  <div class="total-row divider">
                    <span class="total-label">Amount Paid:</span>
                    <span class="total-value">${formatCurrency(payment.amountPaid)}</span>
                  </div>

                  ${payment.changeAmount > 0 ? `
                    <div class="total-row">
                      <span class="total-label">
                        Change ${payment.changeHandling === 'added_to_account' ? '(Added to Account)' : ''}:
                      </span>
                      <span class="total-value" style="color: #059669;">${formatCurrency(payment.changeAmount)}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Payment Method -->
              <div class="section">
                <div class="section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                  </svg>
                  Payment Method
                </div>
                ${payment.paymentMethod !== 'split' ? `
                  <div class="payment-method-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span style="text-transform: capitalize;">${payment.paymentMethod.replace('_', ' ')}</span>
                    ${payment.paymentReference ? `<span style="color: #6b7280; font-size: 13px;">• Ref: ${payment.paymentReference}</span>` : ''}
                  </div>
                ` : `
                  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 12px; text-transform: uppercase;">Split Payment</div>
                    ${payment.splitPayments.map(split => `
                      <div class="split-payment-item">
                        <div>
                          <div class="split-method">${split.method.replace('_', ' ')}</div>
                          ${split.reference ? `<div class="split-reference">Ref: ${split.reference}</div>` : ''}
                        </div>
                        <div class="split-amount">${formatCurrency(split.amount)}</div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>

              <!-- Notes -->
              ${payment.notes ? `
                <div class="section">
                  <div class="notes-section">
                    <div class="notes-title">Additional Notes</div>
                    <div>${payment.notes}</div>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Footer -->
            <div class="receipt-footer">
              <div class="footer-message">✨ Thank you for your business! ✨</div>
              <div class="footer-tagline">Empowering Women, Building Futures</div>
              <div class="footer-contact">
                For inquiries, please contact us at info@womensden.com<br>
                Visit us at www.womensden.com
              </div>
            </div>
          </div>

          <div class="watermark">Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm')}</div>
        </body>
      </html>
    `;
  };

  // Inline styles for the modal content
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    header: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      color: 'white',
      padding: '32px 24px',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    },
    headerOverlay: {
      position: 'absolute',
      top: '-50%',
      right: '-50%',
      width: '200%',
      height: '200%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
      pointerEvents: 'none'
    },
    logoContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '16px',
      position: 'relative',
      zIndex: 1
    },
    logo: {
      width: '70px',
      height: '70px',
      background: 'white',
      borderRadius: '50%',
      padding: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logoImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    },
    companyName: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px',
      letterSpacing: '0.5px',
      position: 'relative',
      zIndex: 1
    },
    businessUnit: {
      fontSize: '16px',
      color: 'rgba(255, 255, 255, 0.95)',
      marginBottom: '20px',
      fontWeight: '500',
      position: 'relative',
      zIndex: 1
    },
    receiptBadge: {
      display: 'inline-block',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      padding: '16px 24px',
      borderRadius: '12px',
      position: 'relative',
      zIndex: 1
    },
    receiptNumber: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '4px',
      letterSpacing: '0.5px'
    },
    receiptDate: {
      fontSize: '13px',
      color: 'rgba(255, 255, 255, 0.9)'
    },
    section: {
      background: '#f9fafb',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    },
    sectionTitle: {
      fontSize: '15px',
      fontWeight: '700',
      color: '#374151',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '2px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px'
    },
    infoItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    infoLabel: {
      fontSize: '11px',
      color: '#6b7280',
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: '0.5px'
    },
    infoValue: {
      fontSize: '15px',
      color: '#111827',
      fontWeight: '600'
    },
    descriptionBox: {
      marginTop: '12px',
      padding: '12px',
      background: 'white',
      borderRadius: '8px',
      borderLeft: '3px solid #8b5cf6'
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    tableHeader: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      color: 'white'
    },
    tableHeaderCell: {
      padding: '12px 14px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    tableRow: {
      borderBottom: '1px solid #e5e7eb'
    },
    tableCell: {
      padding: '12px 14px',
      fontSize: '14px',
      color: '#374151',
      background: 'white'
    },
    totalsSection: {
      background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
      padding: '24px',
      borderRadius: '12px',
      border: '2px solid #e9d5ff'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      fontSize: '14px',
      color: '#374151'
    },
    grandTotal: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '16px 0',
      fontSize: '20px',
      fontWeight: '700',
      color: '#6b21a8',
      borderTop: '2px solid #8b5cf6',
      marginTop: '12px'
    },
    paymentMethodBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      background: 'white',
      padding: '14px 20px',
      borderRadius: '10px',
      border: '2px solid #e5e7eb',
      fontWeight: '600',
      color: '#374151',
      fontSize: '15px'
    },
    splitPaymentItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      background: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '8px'
    },
    notesSection: {
      background: '#fef3c7',
      border: '1px solid #fde047',
      borderLeft: '4px solid #eab308',
      padding: '16px',
      borderRadius: '8px',
      color: '#854d0e'
    },
    notesTitle: {
      fontWeight: '700',
      marginBottom: '8px',
      color: '#713f12'
    },
    footer: {
      textAlign: 'center',
      padding: '24px',
      background: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    },
    footerMessage: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#6b21a8',
      marginBottom: '8px'
    },
    footerTagline: {
      fontSize: '13px',
      color: '#6b7280',
      fontStyle: 'italic'
    },
    actionsContainer: {
      display: 'flex',
      gap: '12px',
      marginTop: '8px'
    },
    actionButton: {
      flex: 1
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div style={styles.container}>
        {/* Beautiful Header */}
        <div style={styles.header}>
          <div style={styles.headerOverlay}></div>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>
              <img src={logo} alt="Women's Den Logo" style={styles.logoImage} />
            </div>
          </div>
          <div style={styles.companyName}>WOMEN'S DEN</div>
          <div style={styles.businessUnit}>{getBusinessUnitName(payment.businessUnit)}</div>
          <div style={styles.receiptBadge}>
            <div style={styles.receiptNumber}>
              {payment.receiptNumber || payment.paymentNumber}
            </div>
            <div style={styles.receiptDate}>
              {format(new Date(payment.paymentDate), 'MMMM dd, yyyy - HH:mm')}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <Receipt size={16} />
            Payment Information
          </div>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Customer Name</div>
              <div style={styles.infoValue}>
                {payment.customer?.firstName} {payment.customer?.lastName}
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Payment Type</div>
              <div style={{ ...styles.infoValue, textTransform: 'capitalize' }}>
                {payment.paymentType.replace('_', ' ')}
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Email</div>
              <div style={{ ...styles.infoValue, fontSize: '13px' }}>
                {payment.customer?.email || 'N/A'}
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Phone</div>
              <div style={styles.infoValue}>
                {payment.customer?.phone || 'N/A'}
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getStatusIcon(payment.status)}
                {getStatusBadge(payment.status)}
              </div>
            </div>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Processed By</div>
              <div style={styles.infoValue}>
                {payment.processedBy?.firstName} {payment.processedBy?.lastName}
              </div>
            </div>
          </div>
          {payment.description && (
            <div style={styles.descriptionBox}>
              <div style={styles.infoLabel}>Description</div>
              <div style={{ color: '#374151', fontSize: '14px', marginTop: '4px' }}>
                {payment.description}
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <DollarSign size={16} />
            Items
          </div>
          <table style={styles.table}>
            <thead style={styles.tableHeader}>
              <tr>
                <th style={styles.tableHeaderCell}>Description</th>
                <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Qty</th>
                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Unit Price</th>
                <th style={{ ...styles.tableHeaderCell, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {payment.items.map((item, index) => (
                <tr key={index} style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, fontWeight: '600', color: '#111827' }}>
                    {item.description}
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                    {item.quantity}
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'right' }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: '700', color: '#6b21a8' }}>
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={styles.totalsSection}>
          <div style={styles.totalRow}>
            <span style={{ fontWeight: '600' }}>Subtotal:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(payment.subtotal)}</span>
          </div>

          {payment.discount > 0 && (
            <div style={styles.totalRow}>
              <span style={{ fontWeight: '600' }}>
                Discount {payment.discountReason && `(${payment.discountReason})`}:
              </span>
              <span style={{ fontWeight: '700', color: '#059669' }}>
                -{formatCurrency(payment.discount)}
              </span>
            </div>
          )}

          {payment.tax > 0 && (
            <div style={styles.totalRow}>
              <span style={{ fontWeight: '600' }}>Tax ({payment.taxRate}%):</span>
              <span style={{ fontWeight: '700' }}>{formatCurrency(payment.tax)}</span>
            </div>
          )}

          <div style={styles.grandTotal}>
            <span>TOTAL AMOUNT:</span>
            <span>{formatCurrency(payment.totalAmount)}</span>
          </div>

          <div style={{ ...styles.totalRow, borderTop: '1px solid #c4b5fd', marginTop: '8px', paddingTop: '12px' }}>
            <span style={{ fontWeight: '600' }}>Amount Paid:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(payment.amountPaid)}</span>
          </div>

          {payment.changeAmount > 0 && (
            <div style={styles.totalRow}>
              <span style={{ fontWeight: '600' }}>
                Change {payment.changeHandling === 'added_to_account' && '(Added to Account)'}:
              </span>
              <span style={{ fontWeight: '700', color: '#059669' }}>
                {formatCurrency(payment.changeAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <CreditCard size={16} />
            Payment Method
          </div>

          {payment.paymentMethod !== 'split' ? (
            <div style={styles.paymentMethodBadge}>
              <DollarSign size={20} />
              <span style={{ textTransform: 'capitalize' }}>
                {payment.paymentMethod.replace('_', ' ')}
              </span>
              {payment.paymentReference && (
                <span style={{ color: '#6b7280', fontSize: '13px' }}>
                  • Ref: {payment.paymentReference}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                SPLIT PAYMENT
              </div>
              {payment.splitPayments.map((split, index) => (
                <div key={index} style={styles.splitPaymentItem}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#374151', textTransform: 'capitalize' }}>
                      {split.method.replace('_', ' ')}
                    </div>
                    {split.reference && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        Ref: {split.reference}
                      </div>
                    )}
                  </div>
                  <div style={{ fontWeight: '700', color: '#6b21a8', fontSize: '15px' }}>
                    {formatCurrency(split.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {payment.notes && (
          <div style={styles.notesSection}>
            <div style={styles.notesTitle}>📝 Additional Notes</div>
            <div>{payment.notes}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actionsContainer}>
          <Button
            variant="outline"
            style={styles.actionButton}
            onClick={() => onEmailReceipt(payment._id)}
          >
            <Mail size={16} style={{ marginRight: '8px' }} />
            Email Receipt
          </Button>
          <Button
            variant="outline"
            style={styles.actionButton}
            onClick={handlePrintReceipt}
          >
            <Printer size={16} style={{ marginRight: '8px' }} />
            Print Receipt
          </Button>
          <Button
            variant="primary"
            style={styles.actionButton}
            onClick={handleDownloadPDF}
          >
            <Download size={16} style={{ marginRight: '8px' }} />
            Download PDF
          </Button>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerMessage}>✨ Thank you for your business! ✨</div>
          <div style={styles.footerTagline}>Empowering Women, Building Futures</div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentDetailModal;
