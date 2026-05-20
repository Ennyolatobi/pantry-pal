import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useRecipeStore from '../../store/recipeStore';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: 'fa-home', label: 'Home' },
    { path: '/search', icon: 'fa-search', label: 'Search' },
    { path: '/favorites', icon: 'fa-heart', label: 'Favorites' },
    { path: '/my-recipes', icon: 'fa-book', label: 'My Recipes' },
    { path: '/meal-planner', icon: 'fa-calendar-alt', label: 'Meal Planner' },
    { path: '/shopping-list', icon: 'fa-shopping-cart', label: 'Shopping List' },
    { path: '/cookbook', icon: 'fa-book-open', label: 'Cookbooks' }
  ];
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src="/logo.png" alt="PantryPal Logo" className="logo-img" />
          <h1 className="logo-text">PantryPal</h1>
        </div>
        <ThemeToggle />
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">
              <i className={`fas ${item.icon}`}></i>
            </span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <p>Made with <i className="fas fa-heart"></i> for food lovers</p>
      </div>
    </aside>
  );
};

const ThemeToggle = () => {
  const { theme, toggleTheme } = useRecipeStore();
  
  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
    </button>
  );
};

export default Sidebar;