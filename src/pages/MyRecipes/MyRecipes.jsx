import React, { useState } from 'react';
import useRecipeStore from '../../store/recipeStore';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import './MyRecipes.css';

const MyRecipes = () => {
  const { myRecipes, addMyRecipe } = useRecipeStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    strMeal: '',
    strCategory: '',
    strArea: '',
    strInstructions: '',
    strMealThumb: 'https://via.placeholder.com/400'
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    addMyRecipe(formData);
    setShowForm(false);
    setFormData({
      strMeal: '',
      strCategory: '',
      strArea: '',
      strInstructions: '',
      strMealThumb: 'https://via.placeholder.com/400'
    });
  };
  
  return (
    <div className="page my-recipes-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-book"></i> My Recipes</h1>
          <p className="subtitle">{myRecipes.length} custom recipe{myRecipes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className="fas fa-plus"></i> Add Recipe
        </button>
      </div>
      
      {showForm && (
        <form className="recipe-form" onSubmit={handleSubmit}>
          <h3><i className="fas fa-edit"></i> Create New Recipe</h3>
          <input
            type="text"
            placeholder="Recipe Name"
            value={formData.strMeal}
            onChange={(e) => setFormData({...formData, strMeal: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Category (e.g., Dessert)"
            value={formData.strCategory}
            onChange={(e) => setFormData({...formData, strCategory: e.target.value})}
          />
          <input
            type="text"
            placeholder="Cuisine (e.g., Italian)"
            value={formData.strArea}
            onChange={(e) => setFormData({...formData, strArea: e.target.value})}
          />
          <textarea
            placeholder="Instructions"
            value={formData.strInstructions}
            onChange={(e) => setFormData({...formData, strInstructions: e.target.value})}
            rows="6"
            required
          />
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              <i className="fas fa-save"></i> Save Recipe
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      )}
      
      {myRecipes.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-book"></i></div>
          <h2>No custom recipes yet</h2>
          <p>Create your first recipe!</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {myRecipes.map((recipe) => (
            <RecipeCard key={recipe.idMeal} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRecipes;