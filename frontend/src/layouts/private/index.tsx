import { Layout, Menu, Typography } from 'antd';
import { NavLink, Outlet, useLocation } from 'react-router';
import { navigationItems } from '../../config/navigation';

const { Content, Header, Sider } = Layout;

function PrivateLayout() {
  const location = useLocation();

  return (
    <Layout className="app-shell">
      <Sider width={248} className="sidebar">
        <div className="brand">DADN Rooms</div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={navigationItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <NavLink to={item.path}>{item.label}</NavLink>,
          }))}
        />
      </Sider>
      <Layout>
        <Header className="topbar">
          <Typography.Title level={2}>Rental Smart Room Management</Typography.Title>
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default PrivateLayout;
