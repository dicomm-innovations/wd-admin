import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import './Table.css';

const Table = ({
  columns,
  data,
  loading = false,
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No data available',
  pagination = true,
  rowsPerPage = 10
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  // Filter data based on search
  const filteredData = searchQuery
    ? safeData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : safeData;

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = pagination
    ? filteredData.slice(startIndex, startIndex + rowsPerPage)
    : filteredData;

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      {searchable && (
        <div className="table-header">
          <div className="table-search">
            <Search size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} style={{ width: column.width }}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'table-row-clickable' : ''}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex}>
                      {column.cell
                        ? column.cell(row)
                        : column.render
                        ? column.render(row[column.key], row)
                        : row[column.accessor || column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && filteredData.length > rowsPerPage && (
        <div className="table-pagination">
          <div className="pagination-info">
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of{' '}
            {filteredData.length} entries
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="pagination-current">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
