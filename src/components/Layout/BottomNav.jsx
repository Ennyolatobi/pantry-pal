import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: 'fa-home', label: 'Home' },
    { path: '/search', icon: 'fa-search', label: 'Search' },
    { path: '/favorites', icon: 'fa-heart', label: 'Favorites' },
    { path: '/meal-planner', icon: 'fa-calendar-alt', label: 'Planner' },
    { path: '/shopping-list', icon: 'fa-shopping-cart', label: 'List' }
  ];
  
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">
              <i className={`fas ${item.icon}`}></i>
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
