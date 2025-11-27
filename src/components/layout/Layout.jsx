import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './Layout.css';

const Layout = ({ children, title, subtitle }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Topbar title={title} subtitle={subtitle} />
        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
