export const searchRecipes = async (query) => {
  const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
  const data = await response.json();
  return data.meals || [];
};

export const getRecipeById = async (id) => {
  const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await response.json();
  return data.meals ? data.meals[0] : null;
};

export const getRandomRecipes = async () => {
  const promises = Array(8).fill().map(() => 
    fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(r => r.json())
  );
  const results = await Promise.all(promises);
  return results.map(r => r.meals[0]);
};

export const getRecipesByCategory = async (category) => {
  const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
  const data = await response.json();
  return data.meals || [];
};