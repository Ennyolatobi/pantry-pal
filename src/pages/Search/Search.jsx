import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '../../components/SearchBar/SearchBar';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { searchRecipes } from '../../utils/api';
import './Search.css';

const Search = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      handleSearch(query);
    }
  }, [location.search]);
  
  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchRecipes(query);
      setRecipes(results);
      if (results.length === 0) {
        setError('No recipes found. Try a different search term.');
      }
    } catch (err) {
      setError('Failed to fetch recipes. Please try again.');
    }
    setLoading(false);
  };
  
  return (
    <div className="page search-page">
      <div className="page-header">
        <div>
          <h1><i className="fas fa-search"></i> Search Recipes</h1>
          {recipes.length > 0 && <p className="results-count">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found</p>}
        </div>
      </div>
      
      <div className="search-bar-container">
        <SearchBar onSearch={handleSearch} />
      </div>
      
      {loading && <LoadingSpinner />}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      )}
      
      {!loading && recipes.length > 0 && (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.idMeal} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
