import React from 'react';
import { Link } from 'react-router-dom';
import useRecipeStore from '../../store/recipeStore';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import './Favorites.css';

const Favorites = () => {
  const { favorites } = useRecipeStore();
  
  return (
    <div className="page favorites-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-heart"></i> My Favorites</h1>
          <p className="subtitle">{favorites.length} saved recipe{favorites.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      
      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="far fa-heart"></i></div>
          <h2>No favorites yet</h2>
          <p>Start exploring recipes and save your favorites!</p>
          <Link to="/search" className="btn-primary">
            <i className="fas fa-search"></i> Browse Recipes
          </Link>
        </div>
      ) : (
        <div className="recipe-grid">
          {favorites.map((recipe) => (
            <RecipeCard key={recipe.idMeal} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;