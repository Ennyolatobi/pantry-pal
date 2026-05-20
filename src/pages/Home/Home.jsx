import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../components/SearchBar/SearchBar';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { getRandomRecipes } from '../../utils/api';
import './Home.css';

const Home = () => {
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      const recipes = await getRandomRecipes();
      setFeaturedRecipes(recipes);
      setLoading(false);
    };
    loadRecipes();
  }, []);
  
  const handleSearch = (query) => {
    navigate(`/search?q=${query}`);
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="page home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Your Personal Recipe Manager</h1>
          <p className="hero-subtitle">
            Discover, save, and organize thousands of recipes. Plan your meals, create shopping lists, and build beautiful cookbooks.
          </p>
          <SearchBar onSearch={handleSearch} />
          
          <div className="hero-features">
            <div className="feature-badge">
              <span className="feature-icon"><i className="fas fa-book-open"></i></span>
              <span>10,000+ Recipes</span>
            </div>
            <div className="feature-badge">
              <span className="feature-icon"><i className="fas fa-calendar-alt"></i></span>
              <span>Meal Planning</span>
            </div>
            <div className="feature-badge">
              <span className="feature-icon"><i className="fas fa-shopping-cart"></i></span>
              <span>Smart Shopping Lists</span>
            </div>
            <div className="feature-badge">
              <span className="feature-icon"><i className="fas fa-book"></i></span>
              <span>Custom Cookbooks</span>
            </div>
          </div>
        </div>
      </section>
      
      <section className="featured-section">
        <h2 className="section-title">Featured Recipes</h2>
        <div className="recipe-grid">
          {featuredRecipes.map((recipe) => (
            <RecipeCard key={recipe.idMeal} recipe={recipe} />
          ))}
        </div>
      </section>
      
      <section className="features-detail-section">
        <h2 className="section-title">Everything You Need</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-large"><i className="fas fa-book-open"></i></div>
            <h3>Recipe Collection</h3>
            <p>Save your favorite recipes and add your own custom creations</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-large"><i className="fas fa-calendar-check"></i></div>
            <h3>Meal Planning</h3>
            <p>Plan your weekly meals and never wonder what's for dinner</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-large"><i className="fas fa-list-ul"></i></div>
            <h3>Shopping Lists</h3>
            <p>Auto-generate shopping lists from recipes and organize by aisle</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-large"><i className="fas fa-book"></i></div>
            <h3>Custom Cookbooks</h3>
            <p>Create beautiful cookbooks to print or share as PDFs</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;