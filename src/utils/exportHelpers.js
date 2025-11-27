import { formatDate, formatCurrency, formatPhoneNumber } from './formatters';

/**
 * CSV Export Utilities
 */

export const convertToCSV = (data, columns) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create header row
  const headers = columns.map(col => col.label || col.key);
  const headerRow = headers.join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key];

      // Apply custom formatter if provided
      if (col.formatter && typeof col.formatter === 'function') {
        value = col.formatter(row);
      }

      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }

      // Escape commas and quotes
      value = String(value).replace(/"/g, '""');

      // Wrap in quotes if contains comma, newline, or quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value}"`;
      }

      return value;
    }).join(',');
  });

  // Combine header and data
  return [headerRow, ...dataRows].join('\n');
};

export const downloadCSV = (data, columns, filename = 'export.csv') => {
  try {
    const csv = convertToCSV(data, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
};

/**
 * Excel-compatible CSV with proper formatting
 */

export const downloadExcelCSV = (data, columns, filename = 'export.csv') => {
  try {
    const csv = convertToCSV(data, columns);
    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Excel CSV export error:', error);
    throw error;
  }
};

/**
 * JSON Export
 */

export const downloadJSON = (data, filename = 'export.json') => {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('JSON export error:', error);
    throw error;
  }
};

/**
 * PDF Export (requires jsPDF library)
 * Note: Install with: npm install jspdf jspdf-autotable
 */

export const downloadPDF = async (data, columns, filename = 'export.pdf', title = 'Export') => {
  try {
    // Dynamic import to avoid loading jsPDF if not needed
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDate(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 28);

    // Prepare table data
    const headers = [columns.map(col => col.label || col.key)];
    const rows = data.map(row =>
      columns.map(col => {
        let value = row[col.key];
        if (col.formatter && typeof col.formatter === 'function') {
          value = col.formatter(row);
        }
        return value ?? '-';
      })
    );

    // Generate table
    doc.autoTable({
      head: headers,
      body: rows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [35, 131, 155] }
    });

    // Save PDF
    doc.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to generate PDF. Make sure jspdf and jspdf-autotable are installed.');
  }
};

/**
 * Print Utilities
 */

export const printTable = (data, columns, title = 'Print') => {
  try {
    // Create print window
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
    }

    // Generate HTML table
    const headers = columns.map(col => `<th>${col.label || col.key}</th>`).join('');
    const rows = data.map(row => {
      const cells = columns.map(col => {
        let value = row[col.key];
        if (col.formatter && typeof col.formatter === 'function') {
          value = col.formatter(row);
        }
        return `<td>${value ?? '-'}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    // Create print document
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              color: #23839b;
              margin-bottom: 10px;
            }
            .meta {
              color: #666;
              margin-bottom: 20px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #23839b;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">Generated: ${formatDate(new Date(), 'MMMM dd, yyyy HH:mm')}</div>
          <table>
            <thead>
              <tr>${headers}</tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
};

/**
 * Preset Column Definitions for Common Exports
 */

export const customerExportColumns = [
  { key: 'customerId', label: 'Customer ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone', formatter: (row) => formatPhoneNumber(row.phone) },
  { key: 'loyaltyPoints', label: 'Loyalty Points' },
  { key: 'createdAt', label: 'Registered Date', formatter: (row) => formatDate(row.createdAt) }
];

export const employeeExportColumns = [
  { key: 'employeeId', label: 'Employee ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'businessUnit', label: 'Business Unit' },
  { key: 'role', label: 'Role' },
  { key: 'position', label: 'Position' },
  { key: 'createdAt', label: 'Hire Date', formatter: (row) => formatDate(row.createdAt) }
];

export const inventoryExportColumns = [
  { key: 'itemCode', label: 'Item Code' },
  { key: 'name', label: 'Item Name' },
  { key: 'category', label: 'Category' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit', label: 'Unit' },
  { key: 'costPrice', label: 'Cost Price', formatter: (row) => formatCurrency(row.costPrice) },
  { key: 'sellingPrice', label: 'Selling Price', formatter: (row) => formatCurrency(row.sellingPrice) },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' }
];

export const bookingExportColumns = [
  { key: 'bookingId', label: 'Booking ID' },
  { key: 'customerName', label: 'Customer' },
  { key: 'bookingDate', label: 'Date', formatter: (row) => formatDate(row.bookingDate) },
  { key: 'status', label: 'Status' },
  { key: 'totalPrice', label: 'Total', formatter: (row) => formatCurrency(row.totalPrice) }
];

/**
 * Batch Export Helper
 */

export const exportData = async (data, columns, format = 'csv', filename = 'export', title = 'Export') => {
  const timestamp = formatDate(new Date(), 'yyyyMMdd_HHmmss');
  const fullFilename = `${filename}_${timestamp}`;

  switch (format.toLowerCase()) {
    case 'csv':
      return downloadCSV(data, columns, `${fullFilename}.csv`);

    case 'excel':
      return downloadExcelCSV(data, columns, `${fullFilename}.csv`);

    case 'json':
      return downloadJSON(data, `${fullFilename}.json`);

    case 'pdf':
      return downloadPDF(data, columns, `${fullFilename}.pdf`, title);

    case 'print':
      return printTable(data, columns, title);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Copy to Clipboard
 */

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (error) {
        document.body.removeChild(textArea);
        throw error;
      }
    }
  } catch (error) {
    console.error('Copy to clipboard error:', error);
    return false;
  }
};

export const copyTableToClipboard = (data, columns) => {
  try {
    const csv = convertToCSV(data, columns);
    return copyToClipboard(csv);
  } catch (error) {
    console.error('Copy table error:', error);
    return false;
  }
};

export default {
  convertToCSV,
  downloadCSV,
  downloadExcelCSV,
  downloadJSON,
  downloadPDF,
  printTable,
  exportData,
  copyToClipboard,
  copyTableToClipboard,
  // Preset columns
  customerExportColumns,
  employeeExportColumns,
  inventoryExportColumns,
  bookingExportColumns
};
