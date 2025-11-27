import { Search } from 'lucide-react';
import NotificationDropdown from '../common/NotificationDropdown';
import './Topbar.css';

const Topbar = ({ title, subtitle }) => {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-title-section">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
          />
        </div>

        <NotificationDropdown />
      </div>
    </div>
  );
};

export default Topbar;
