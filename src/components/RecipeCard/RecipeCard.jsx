import React from 'react';
import { useNavigate } from 'react-router-dom';
import useRecipeStore from '../../store/recipeStore';
import './RecipeCard.css';

const RecipeCard = ({ recipe, showActions = true }) => {
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useRecipeStore();
  const favorite = isFavorite(recipe.idMeal);
  
  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    if (favorite) {
      removeFavorite(recipe.idMeal);
    } else {
      addFavorite(recipe);
    }
  };
  
  return (
    <div className="recipe-card" onClick={() => navigate(`/recipe/${recipe.idMeal}`)}>
      <div className="recipe-card-image">
        <img src={recipe.strMealThumb} alt={recipe.strMeal} />
        {showActions && (
          <button
            className={`favorite-btn ${favorite ? 'active' : ''}`}
            onClick={handleFavoriteToggle}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <i className={`fas fa-heart ${!favorite ? 'far' : ''}`}></i>
          </button>
        )}
      </div>
      <div className="recipe-card-content">
        <h3>{recipe.strMeal}</h3>
        <div className="recipe-card-meta">
          <span className="category">
            <i className="fas fa-tag"></i> {recipe.strCategory}
          </span>
          <span className="area">
            <i className="fas fa-globe"></i> {recipe.strArea}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;