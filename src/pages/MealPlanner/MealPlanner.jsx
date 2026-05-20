import React, { useState } from 'react';
import useRecipeStore from '../../store/recipeStore';
import './MealPlanner.css';

const MealPlanner = () => {
  const { mealPlan, addMealToPlan, removeMealFromPlan, favorites } = useRecipeStore();
  const [showRecipeSelector, setShowRecipeSelector] = useState(null);
  
  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  return (
    <div className="page meal-planner-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-calendar-alt"></i> Meal Planner</h1>
          <p className="subtitle">Plan your weekly meals</p>
        </div>
      </div>
      
      <div className="meal-planner-grid">
        {getWeekDates().map((date) => (
          <div key={date} className="day-column">
            <div className="day-header">
              <h3>{new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
            </div>
            
            {meals.map((meal) => (
              <div key={meal} className="meal-slot">
                <h4><i className="fas fa-utensils"></i> {meal}</h4>
                {mealPlan[date]?.[meal] ? (
                  <div className="planned-meal">
                    <img src={mealPlan[date][meal].strMealThumb} alt={mealPlan[date][meal].strMeal} />
                    <p>{mealPlan[date][meal].strMeal}</p>
                    <button 
                      onClick={() => removeMealFromPlan(date, meal)} 
                      className="remove-btn"
                      aria-label="Remove meal"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <button
                    className="add-meal-btn"
                    onClick={() => setShowRecipeSelector({ date, meal })}
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {showRecipeSelector && (
        <div className="modal-overlay" onClick={() => setShowRecipeSelector(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2><i className="fas fa-heart"></i> Select from Favorites</h2>
            {favorites.length === 0 ? (
              <p className="no-favorites-msg">
                <i className="fas fa-info-circle"></i> 
                No favorites yet. Add some recipes to favorites first!
              </p>
            ) : (
              <div className="recipe-selector-grid">
                {favorites.map((recipe) => (
                  <div
                    key={recipe.idMeal}
                    className="recipe-selector-item"
                    onClick={() => {
                      addMealToPlan(showRecipeSelector.date, showRecipeSelector.meal, recipe);
                      setShowRecipeSelector(null);
                    }}
                  >
                    <img src={recipe.strMealThumb} alt={recipe.strMeal} />
                    <p>{recipe.strMeal}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowRecipeSelector(null)} className="btn-secondary">
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanner;