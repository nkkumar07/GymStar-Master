'use client';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { AdminProvider } from '@/context/AdminContext';
import './globals.css';
import AdminHeader from '@/components/AdminHeader';
import AdminFooter from '@/components/AdminFooter';
import { Toaster } from 'sonner';
import AdminWithAuth from '@/components/AdminWithAuth';
import { 
  FiHome, 
  FiUsers, 
  FiCreditCard, 
  FiCalendar, 
  FiUserPlus, 
  FiImage,
  FiActivity,
  FiSettings
} from 'react-icons/fi';
import { FaDumbbell } from 'react-icons/fa';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin';

  // Helper function to check active link
  const isActive = (href) => pathname === href;

  return (
    <html lang="en">
      <body className={!isLoginPage ? "admin-layout" : ""}>
        <AdminProvider>
          <Toaster richColors position="top-center" />
          {isLoginPage ? (
            children
          ) : (
            <div className="admin-dashboard-container">
              <div className="sidebar">
                <div className="logo">
                  <FaDumbbell className="logo-icon" />
                  <span>GymStar</span>
                </div>
                <nav>
                  <ul>
                    <li>
                      <Link 
                        href="/admin/dashboard" 
                        className={isActive('/admin/dashboard') ? 'active' : ''}
                      >
                        <FiHome className="nav-icon" />
                        <span>Dashboard</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/admin/user" 
                        className={isActive('/admin/user') ? 'active' : ''}
                      >
                        <FiUsers className="nav-icon" />
                        <span>Customers</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/admin/membership" 
                        className={isActive('/admin/membership') ? 'active' : ''}
                      >
                        <FiCreditCard className="nav-icon" />
                        <span>Membership Plans</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/admin/class" 
                        className={isActive('/admin/class') ? 'active' : ''}
                      >
                        <FiCalendar className="nav-icon" />
                        <span>Classes</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/admin/trainers" 
                        className={isActive('/admin/trainers') ? 'active' : ''}
                      >
                        <FiUserPlus className="nav-icon" />
                        <span>Trainers</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/admin/sliders" 
                        className={isActive('/admin/sliders') ? 'active' : ''}
                      >
                        <FiImage className="nav-icon" />
                        <span>Sliders</span>
                      </Link>
                    </li>
                    {/* Additional optional menu items */}
                    <li className="menu-divider"></li>
                    <li>
                      <Link 
                        href="/admin/analytics" 
                        className={isActive('/admin/analytics') ? 'active' : ''}
                      >
                        <FiActivity className="nav-icon" />
                        <span>Analytics</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/admin/settings" 
                        className={isActive('/admin/settings') ? 'active' : ''}
                      >
                        <FiSettings className="nav-icon" />
                        <span>Settings</span>
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>

              <div className="main-content-wrapper">
                <AdminHeader />
                <main className="admin-main-content">
                  <AdminWithAuth>{children}</AdminWithAuth>
                </main>
                <AdminFooter />
              </div>
            </div>
          )}
        </AdminProvider>
      </body>
    </html>
  );
}