import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3><i className="fas fa-utensils"></i> PantryPal</h3>
          <p>Your personal recipe manager for discovering, saving, and organizing delicious recipes.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <Link to="/"><i className="fas fa-home"></i> Home</Link>
          <Link to="/search"><i className="fas fa-search"></i> Search Recipes</Link>
          <Link to="/favorites"><i className="fas fa-heart"></i> My Favorites</Link>
          <Link to="/meal-planner"><i className="fas fa-calendar-alt"></i> Meal Planner</Link>
        </div>
        
        <div className="footer-section">
          <h4>Features</h4>
          <Link to="/my-recipes"><i className="fas fa-book"></i> My Recipes</Link>
          <Link to="/shopping-list"><i className="fas fa-shopping-cart"></i> Shopping List</Link>
          <Link to="/cookbook"><i className="fas fa-book-open"></i> Cookbooks</Link>
        </div>
        
        <div className="footer-section">
          <h4>Connect</h4>
          <p><i className="fas fa-envelope"></i> contact@pantrypal.com</p>
          <p><i className="fas fa-globe"></i> www.pantrypal.com</p>
          <div className="social-links">
            <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
            <a href="#" aria-label="Pinterest"><i className="fab fa-pinterest"></i></a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 PantryPal. Made with <i className="fas fa-heart"></i> for food lovers.</p>
      </div>
    </footer>
  );
};

export default Footer;