import nigerianRecipes from '../data/recipes/nigerianRecipes.json';
import africanRecipes from '../data/recipes/africanRecipes.json';

// ─────────────────────────────────────────────────────────────────────────────
// NORMALISERS
// Convert local recipe JSON → the app's shared recipe shape (TheMealDB-style)
// ─────────────────────────────────────────────────────────────────────────────

export const normaliseLocal = (r) => {
  // Build strIngredientN / strMeasureN fields so RecipeDetail works unchanged
  const ingredientFields = {};
  (r.ingredients || []).forEach((ing, i) => {
    ingredientFields[`strIngredient${i + 1}`] = ing;
    ingredientFields[`strMeasure${i + 1}`] = '';
  });

  return {
    // Core identity
    idMeal: r.id,
    strMeal: r.name,
    strMealThumb: r.image,
    strCategory: r.category,
    strArea: r.country,
    strInstructions: (r.instructions || []).join('\n\n'),
    strYoutube: '',
    strSource: '',
    // Extended local fields
    _source: 'local',
    _local: true,
    _region: r.region,
    _tribe: r.tribe,
    _country: r.country,
    _budgetLevel: r.budgetLevel,
    _cookTime: r.cookTime,
    _servings: r.servings,
    _difficulty: r.difficulty,
    _mealType: r.mealType,
    _description: r.description,
    _aliases: r.aliases || [],
    _keywords: r.keywords || [],
    _tags: r.tags || [],
    _nutrition: r.nutrition || {},
    _marketEstimate: r.marketEstimate || {},
    ...ingredientFields,
  };
};

// All local recipes normalised (Nigerian + African), Nigerian first
export const ALL_LOCAL_RECIPES = [
  ...nigerianRecipes.map(normaliseLocal),
  ...africanRecipes.map(normaliseLocal),
];

export const NIGERIAN_RECIPES = nigerianRecipes.map(normaliseLocal);
export const AFRICAN_RECIPES  = africanRecipes.map(normaliseLocal);

// ─────────────────────────────────────────────────────────────────────────────
// TheMealDB  (western recipes — unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export const mealDbSearch = async (query) => {
  try {
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data = await res.json();
    return (data.meals || []).map(r => ({ ...r, _source: 'mealdb' }));
  } catch { return []; }
};

export const getMealDbById = async (id) => {
  try {
    const res  = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    return data.meals ? { ...data.meals[0], _source: 'mealdb' } : null;
  } catch { return null; }
};

export const getRandomMealDbRecipes = async (count = 8) => {
  try {
    const results = await Promise.all(
      Array(count).fill(null).map(() =>
        fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(r => r.json())
      )
    );
    return results.map(r => ({ ...r.meals[0], _source: 'mealdb' }));
  } catch { return []; }
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED RECIPE LOOKUP
// Always checks local first so cached Spoonacular-era IDs don't crash
// ─────────────────────────────────────────────────────────────────────────────

export const getRecipeById = async (id) => {
  // 1. Local Nigerian / African
  const local = ALL_LOCAL_RECIPES.find(r => r.idMeal === id);
  if (local) return local;

  // 2. TheMealDB (numeric id)
  if (!String(id).startsWith('sp_')) {
    return getMealDbById(id);
  }

  return null; // old Spoonacular IDs — let RecipeDetail handle the fallback
};

// ─────────────────────────────────────────────────────────────────────────────
// MERGED SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export const searchAllRecipes = async (query, filter = 'all') => {
  const q = query.toLowerCase().trim();

  // ── African / Nigerian filter: local only, no API call ──
  if (filter === 'nigerian') {
    return q
      ? NIGERIAN_RECIPES.filter(r => recipeMatchesQuery(r, q))
      : NIGERIAN_RECIPES;
  }

  if (filter === 'african') {
    const pool = [...NIGERIAN_RECIPES, ...AFRICAN_RECIPES];
    return q ? pool.filter(r => recipeMatchesQuery(r, q)) : pool;
  }

  if (filter === 'ghana')       return filterByCountry('Ghana', q);
  if (filter === 'ethiopia')    return filterByCountry('Ethiopia', q);
  if (filter === 'kenya')       return filterByCountry('Kenya', q);
  if (filter === 'southafrica') return filterByCountry('South Africa', q);
  if (filter === 'senegal')     return filterByCountry('Senegal', q);
  if (filter === 'morocco')     return filterByCountry('Morocco', q);

  if (filter === 'breakfast')   return filterByMealType('Breakfast', q);
  if (filter === 'hausa')       return filterByTribe('Hausa', q);
  if (filter === 'yoruba')      return filterByTribe('Yoruba', q);
  if (filter === 'igbo')        return filterByTribe('Igbo', q);

  // ── Budget filters ──
  if (filter === 'budget-low')    return filterByBudget('low', q);
  if (filter === 'budget-medium') return filterByBudget('medium', q);

  // ── All cuisines: local first, then TheMealDB API ──
  if (!q) return ALL_LOCAL_RECIPES;

  const localHits = ALL_LOCAL_RECIPES.filter(r => recipeMatchesQuery(r, q));
  const apiHits   = await mealDbSearch(q);

  // Deduplicate by title
  const seen = new Set(localHits.map(r => r.strMeal.toLowerCase()));
  const merged = [
    ...localHits,
    ...apiHits.filter(r => !seen.has(r.strMeal.toLowerCase()))
  ];
  return merged;
};

// ─────────────────────────────────────────────────────────────────────────────
// FILTER HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const filterByCountry  = (country, q) =>
  ALL_LOCAL_RECIPES
    .filter(r => r._country === country)
    .filter(r => !q || recipeMatchesQuery(r, q));

const filterByMealType = (type, q) =>
  ALL_LOCAL_RECIPES
    .filter(r => r._mealType === type)
    .filter(r => !q || recipeMatchesQuery(r, q));

const filterByTribe    = (tribe, q) =>
  ALL_LOCAL_RECIPES
    .filter(r => r._tribe === tribe || r._tribe === 'All')
    .filter(r => r._tribe === tribe) // strict: only the requested tribe + All
    .filter(r => !q || recipeMatchesQuery(r, q));

const filterByBudget   = (level, q) =>
  ALL_LOCAL_RECIPES
    .filter(r => r._budgetLevel === level)
    .filter(r => !q || recipeMatchesQuery(r, q));

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY / INTELLIGENT MATCH
// Checks: name, aliases, keywords, tags, ingredients, tribe, country, category
// Tolerates simple typos via a 2-char levenshtein gate
// ─────────────────────────────────────────────────────────────────────────────

export const recipeMatchesQuery = (recipe, rawQuery) => {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return true;

  const searchFields = [
    recipe.strMeal,
    recipe.strCategory,
    recipe.strArea,
    recipe._tribe,
    recipe._country,
    recipe._region,
    recipe._mealType,
    recipe._description,
    ...(recipe._aliases  || []),
    ...(recipe._keywords || []),
    ...(recipe._tags     || []),
  ].filter(Boolean).map(f => f.toLowerCase());

  // Also include ingredient values
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    if (ing) searchFields.push(ing.toLowerCase());
  }

  const words = q.split(/\s+/);

  return words.every(word =>
    searchFields.some(field =>
      field.includes(word) || levenshtein(field, word) <= 2
    )
  );
};

// Levenshtein distance — tolerates up to 2-char typos
const levenshtein = (a, b) => {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
};

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET FILTER
// ─────────────────────────────────────────────────────────────────────────────

export const filterByMaxBudget = (maxBudgetNGN) =>
  ALL_LOCAL_RECIPES
    .filter(r => r._marketEstimate?.average <= maxBudgetNGN)
    .sort((a, b) => a._marketEstimate.average - b._marketEstimate.average);

// ─────────────────────────────────────────────────────────────────────────────
// PANTRY MATCH
// Returns recipes ranked by % of their ingredients the user already has
// ─────────────────────────────────────────────────────────────────────────────

export const pantryMatch = (pantryIngredients) => {
  const pantry = pantryIngredients.map(i => i.toLowerCase().trim());

  return ALL_LOCAL_RECIPES
    .map(recipe => {
      const ings = [];
      for (let i = 1; i <= 20; i++) {
        const ing = recipe[`strIngredient${i}`];
        if (ing && ing.trim()) ings.push(ing.toLowerCase());
      }
      if (ings.length === 0) return null;

      const matched = ings.filter(ing =>
        pantry.some(p => ing.includes(p) || p.includes(ing) || levenshtein(ing, p) <= 2)
      );
      const percent = Math.round((matched.length / ings.length) * 100);
      return { recipe, percent, matchedCount: matched.length, totalCount: ings.length };
    })
    .filter(r => r && r.percent >= 30)
    .sort((a, b) => b.percent - a.percent);
};

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY HELPERS  (used by the Home page sections)
// ─────────────────────────────────────────────────────────────────────────────

export const getByTribe   = (tribe)   => NIGERIAN_RECIPES.filter(r => r._tribe   === tribe);
export const getByCountry = (country) => ALL_LOCAL_RECIPES.filter(r => r._country === country);
export const getBreakfast = ()        => ALL_LOCAL_RECIPES.filter(r => r._mealType === 'Breakfast');
export const getBudgetMeals = (max)   => filterByMaxBudget(max);
export const getTrending  = ()        => ALL_LOCAL_RECIPES.filter(r =>
  r._tags?.some(t => ['party food', 'street food', 'national favourite'].includes(t))
);
