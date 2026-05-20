import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useRecipeStore from '../../store/recipeStore';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { getRecipeById } from '../../utils/api';
import './RecipeDetail.css';

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);
  const { addFavorite, removeFavorite, isFavorite, addToShoppingList } = useRecipeStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadRecipe = async () => {
      const data = await getRecipeById(id);
      setRecipe(data);
      setLoading(false);
    };
    loadRecipe();
  }, [id]);
  
  if (loading) return <LoadingSpinner />;
  if (!recipe) return (
    <div className="error-message">
      <i className="fas fa-exclamation-triangle"></i>
      <p>Recipe not found</p>
    </div>
  );
  
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({ ingredient, measure });
    }
  }
  
  const handleAddToShoppingList = () => {
    addToShoppingList(ingredients);
    alert('✓ Ingredients added to shopping list!');
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: recipe.strMeal,
        text: `Check out this recipe: ${recipe.strMeal}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('✓ Link copied to clipboard!');
    }
  };
  
  return (
    <div className="page recipe-detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left"></i> Back
      </button>
      
      <div className="recipe-detail">
        <div className="recipe-detail-header">
          <img src={recipe.strMealThumb} alt={recipe.strMeal} className="recipe-detail-image" />
          <div className="recipe-detail-info">
            <h1>{recipe.strMeal}</h1>
            <div className="recipe-meta">
              <span className="badge"><i className="fas fa-tag"></i> {recipe.strCategory}</span>
              <span className="badge"><i className="fas fa-globe"></i> {recipe.strArea}</span>
            </div>
            
            <div className="recipe-actions">
              <button
                className={`btn-action ${isFavorite(recipe.idMeal) ? 'active' : ''}`}
                onClick={() => isFavorite(recipe.idMeal) ? removeFavorite(recipe.idMeal) : addFavorite(recipe)}
              >
                <i className={`fas fa-heart ${!isFavorite(recipe.idMeal) ? 'far' : ''}`}></i>
                {isFavorite(recipe.idMeal) ? 'Saved' : 'Save'}
              </button>
              <button className="btn-action" onClick={handleAddToShoppingList}>
                <i className="fas fa-shopping-cart"></i> Add to List
              </button>
              <button className="btn-action" onClick={handleShare}>
                <i className="fas fa-share-alt"></i> Share
              </button>
            </div>
            
            <div className="servings-control">
              <label><i className="fas fa-users"></i> Servings:</label>
              <button onClick={() => setServings(Math.max(1, servings - 1))}>
                <i className="fas fa-minus"></i>
              </button>
              <span>{servings}</span>
              <button onClick={() => setServings(servings + 1)}>
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div className="recipe-detail-content">
          <div className="ingredients-section">
            <h2><i className="fas fa-list-ul"></i> Ingredients</h2>
            <ul className="ingredients-list">
              {ingredients.map((item, index) => (
                <li key={index}>
                  <span className="ingredient-measure">{item.measure}</span>
                  <span className="ingredient-name">{item.ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="instructions-section">
            <h2><i className="fas fa-clipboard-list"></i> Instructions</h2>
            <div className="instructions-text">
              {recipe.strInstructions.split('\n').map((step, index) => (
                step.trim() && <p key={index}>{step}</p>
              ))}
            </div>
            
            {recipe.strYoutube && (
              <div className="video-section">
                <h3><i className="fab fa-youtube"></i> Video Tutorial</h3>
                <a href={recipe.strYoutube} target="_blank" rel="noopener noreferrer" className="video-link">
                  <i className="fas fa-play-circle"></i> Watch on YouTube
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;