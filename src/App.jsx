/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Heart,
  BookOpen,
  Calendar,
  ShoppingCart,
  Library,
  Sun,
  Moon,
  ArrowLeft,
  Plus,
  Minus,
  X,
  Share2,
  Tag,
  Globe,
  Users,
  Printer,
  Play,
  ChevronRight,
  UtensilsCrossed,
  Utensils,
  ListChecks,
  CalendarCheck,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Pencil,
  Trash2,
  BookMarked,
  Save,
  Menu,
  Clock,
  Star,
  TrendingUp,
  Filter,
  SlidersHorizontal
} from 'lucide-react';

// ============ ZUSTAND STORE ============
const useRecipeStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      myRecipes: [],
      shoppingList: [],
      mealPlan: {},
      cookbooks: [],
      recentlyViewed: [],
      theme: 'light',

      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      addRecentlyViewed: (recipe) => set((state) => {
        const filtered = state.recentlyViewed.filter(r => r.idMeal !== recipe.idMeal);
        return { recentlyViewed: [recipe, ...filtered].slice(0, 12) };
      }),

      addFavorite: (recipe) => set((state) => {
        if (!state.favorites.find(f => f.idMeal === recipe.idMeal)) {
          return { favorites: [...state.favorites, recipe] };
        }
        return state;
      }),

      removeFavorite: (id) => set((state) => ({
        favorites: state.favorites.filter(f => f.idMeal !== id)
      })),

      isFavorite: (id) => get().favorites.some(f => f.idMeal === id),

      addToShoppingList: (items) => set((state) => ({
        shoppingList: [...state.shoppingList, ...items.map(item => ({
          id: Date.now() + Math.random(),
          name: item.ingredient,
          amount: item.measure,
          checked: false,
          category: getCategoryForIngredient(item.ingredient)
        }))]
      })),

      toggleShoppingItem: (id) => set((state) => ({
        shoppingList: state.shoppingList.map(item =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      })),

      removeShoppingItem: (id) => set((state) => ({
        shoppingList: state.shoppingList.filter(item => item.id !== id)
      })),

      clearCheckedItems: () => set((state) => ({
        shoppingList: state.shoppingList.filter(item => !item.checked)
      })),

      addMealToPlan: (date, meal, recipe) => set((state) => ({
        mealPlan: {
          ...state.mealPlan,
          [date]: {
            ...state.mealPlan[date],
            [meal]: recipe
          }
        }
      })),

      removeMealFromPlan: (date, meal) => set((state) => {
        const newPlan = { ...state.mealPlan };
        if (newPlan[date]) {
          delete newPlan[date][meal];
          if (Object.keys(newPlan[date]).length === 0) {
            delete newPlan[date];
          }
        }
        return { mealPlan: newPlan };
      }),

      addMyRecipe: (recipe) => set((state) => ({
        myRecipes: [...state.myRecipes, { ...recipe, idMeal: Date.now().toString() }]
      })),

      removeMyRecipe: (id) => set((state) => ({
        myRecipes: state.myRecipes.filter(r => r.idMeal !== id)
      })),

      createCookbook: (name, recipes) => set((state) => ({
        cookbooks: [...state.cookbooks, {
          id: Date.now().toString(),
          name,
          recipes,
          createdAt: new Date().toISOString()
        }]
      })),

      deleteCookbook: (id) => set((state) => ({
        cookbooks: state.cookbooks.filter(c => c.id !== id)
      }))
    }),
    { name: 'recipe-keeper-storage' }
  )
);

const getCategoryForIngredient = (ingredient) => {
  const categories = {
    'Produce': ['lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'potato', 'celery'],
    'Meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'bacon', 'sausage'],
    'Dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'eggs'],
    'Pantry': ['flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'rice', 'pasta'],
    'Spices': ['cumin', 'paprika', 'oregano', 'basil', 'thyme', 'cinnamon']
  };
  const lowerIngredient = ingredient.toLowerCase();
  for (const [category, items] of Object.entries(categories)) {
    if (items.some(item => lowerIngredient.includes(item))) return category;
  }
  return 'Other';
};

// ============ API FUNCTIONS ============
const searchRecipes = async (query) => {
  const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
  const data = await response.json();
  return data.meals || [];
};

const getRecipeById = async (id) => {
  const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await response.json();
  return data.meals ? data.meals[0] : null;
};

const getRandomRecipes = async () => {
  const promises = Array(8).fill().map(() =>
    fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(r => r.json())
  );
  const results = await Promise.all(promises);
  return results.map(r => r.meals[0]);
};

// ============ COMPONENTS ============

const ThemeToggle = () => {
  const { theme, toggleTheme } = useRecipeStore();
  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner-ring">
      <Loader2 size={32} className="spin-icon" />
    </div>
    <p>Loading recipes&hellip;</p>
  </div>
);

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-mark">
            <UtensilsCrossed size={22} />
          </div>
          <span className="logo-text">PantryPal</span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="sidebar-nav">
        {ALL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon"><Icon size={18} /></span>
              <span className="nav-label">{item.label}</span>
              {isActive && <ChevronRight size={14} className="nav-chevron" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Heart size={12} className="footer-heart" />
        <span>Made for food lovers</span>
      </div>
    </aside>
  );
};

const ALL_NAV_ITEMS = [
  { path: '/', icon: HomeIcon, label: 'Home' },
  { path: '/search', icon: SearchIcon, label: 'Search' },
  { path: '/favorites', icon: Heart, label: 'Favorites' },
  { path: '/my-recipes', icon: BookOpen, label: 'My Recipes' },
  { path: '/meal-planner', icon: Calendar, label: 'Meal Planner' },
  { path: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
  { path: '/cookbook', icon: Library, label: 'Cookbooks' }
];

const MobileDrawer = ({ open, onClose }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useRecipeStore();

  // Close drawer on route change
  useEffect(() => { onClose(); }, [location.pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {open && <div className="drawer-backdrop" onClick={onClose} />}
      <div className={`mobile-drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="logo-container">
            <div className="logo-mark"><UtensilsCrossed size={20} /></div>
            <span className="logo-text">PantryPal</span>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="drawer-nav">
          {ALL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`drawer-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon"><Icon size={18} /></span>
                <span>{item.label}</span>
                {isActive && <ChevronRight size={14} className="nav-chevron" />}
              </Link>
            );
          })}
        </nav>
        <div className="drawer-footer">
          <button className="drawer-theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

const MobileHeader = ({ onMenuOpen }) => {
  return (
    <header className="mobile-header">
      <button className="mobile-menu-btn" onClick={onMenuOpen} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="mobile-logo">
        <div className="logo-mark logo-mark--sm"><UtensilsCrossed size={16} /></div>
        <span className="logo-text">PantryPal</span>
      </div>
      <ThemeToggle />
    </header>
  );
};

const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/search', icon: SearchIcon, label: 'Search' },
    { path: '/favorites', icon: Heart, label: 'Saved' },
    { path: '/meal-planner', icon: Calendar, label: 'Planner' },
    { path: '/shopping-list', icon: ShoppingCart, label: 'List' }
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="bottom-nav-icon"><Icon size={20} /></span>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const RecipeCard = ({ recipe, showActions = true }) => {
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useRecipeStore();
  const favorite = isFavorite(recipe.idMeal);

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    favorite ? removeFavorite(recipe.idMeal) : addFavorite(recipe);
  };

  return (
    <div className="recipe-card" onClick={() => navigate(`/recipe/${recipe.idMeal}`)}>
      <div className="recipe-card-image">
        <img src={recipe.strMealThumb} alt={recipe.strMeal} loading="lazy" />
        {showActions && (
          <button
            className={`favorite-btn ${favorite ? 'active' : ''}`}
            onClick={handleFavoriteToggle}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>
      <div className="recipe-card-content">
        <h3>{recipe.strMeal}</h3>
        <div className="recipe-card-meta">
          {recipe.strCategory && <span className="tag">{recipe.strCategory}</span>}
          {recipe.strArea && <span className="tag tag-secondary">{recipe.strArea}</span>}
        </div>
      </div>
    </div>
  );
};

const SearchBar = ({ onSearch, placeholder = 'Search recipes...' }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <SearchIcon size={18} className="search-icon-prefix" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
      </div>
      <button type="submit" className="search-btn">Search</button>
    </form>
  );
};

// ============ PAGES ============

const Home = () => {
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { recentlyViewed } = useRecipeStore();

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      const recipes = await getRandomRecipes();
      setFeaturedRecipes(recipes);
      setLoading(false);
    };
    loadRecipes();
  }, []);

  const handleSearch = (query) => navigate(`/search?q=${query}`);

  if (loading) return <LoadingSpinner />;

  const features = [
    { icon: BookOpen, label: '10,000+ Recipes' },
    { icon: Calendar, label: 'Meal Planning' },
    { icon: ShoppingCart, label: 'Smart Shopping' },
    { icon: Library, label: 'Custom Cookbooks' }
  ];

  const featureCards = [
    { icon: BookOpen, title: 'Recipe Collection', desc: 'Save your favorites and add your own custom creations' },
    { icon: CalendarCheck, title: 'Meal Planning', desc: 'Plan your weekly meals and never wonder what\'s for dinner' },
    { icon: ListChecks, title: 'Shopping Lists', desc: 'Auto-generate shopping lists from recipes, organized by aisle' },
    { icon: Library, title: 'Custom Cookbooks', desc: 'Build beautiful cookbooks to print or share as PDFs' }
  ];

  return (
    <div className="page home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Your Personal Recipe Manager</h1>
          <p className="hero-subtitle">
            Discover, save, and organize thousands of recipes. Plan meals, build shopping lists, and create beautiful cookbooks.
          </p>
          <SearchBar onSearch={handleSearch} />
          <div className="hero-features">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="feature-badge">
                <Icon size={16} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-header">
          <h2 className="section-title">Featured Recipes</h2>
          <Link to="/search" className="section-link">View all <ChevronRight size={14} /></Link>
        </div>
        <div className="recipe-grid">
          {featuredRecipes.map((recipe) => (
            <RecipeCard key={recipe.idMeal} recipe={recipe} />
          ))}
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="featured-section">
          <div className="section-header">
            <h2 className="section-title"><Clock size={18} style={{display:'inline',verticalAlign:'middle',marginRight:'0.375rem'}} />Recently Viewed</h2>
          </div>
          <div className="recipe-grid">
            {recentlyViewed.slice(0, 4).map((recipe) => (
              <RecipeCard key={recipe.idMeal} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      <section className="features-detail-section">
        <h2 className="section-title">Everything You Need</h2>
        <div className="features-grid">
          {featureCards.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-card-icon"><Icon size={28} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const Search = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) handleSearch(query);
  }, [location.search]);

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const results = await searchRecipes(query);
      setRecipes(results);
      if (results.length === 0) setError('No recipes found. Try a different search term.');
    } catch {
      setError('Failed to fetch recipes. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="page search-page">
      <div className="page-header">
        <div>
          <h1>Search Recipes</h1>
          {recipes.length > 0 && (
            <p className="subtitle">{recipes.length} result{recipes.length !== 1 ? 's' : ''} found</p>
          )}
        </div>
      </div>

      <div className="search-bar-container">
        <SearchBar onSearch={handleSearch} />
      </div>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="inline-notice inline-notice--warning">
          <AlertCircle size={18} />
          <span>{error}</span>
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

const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const { addFavorite, removeFavorite, isFavorite, addToShoppingList, addRecentlyViewed } = useRecipeStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadRecipe = async () => {
      const data = await getRecipeById(id);
      setRecipe(data);
      if (data) addRecentlyViewed(data);
      setLoading(false);
    };
    loadRecipe();
  }, [id]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  if (loading) return <LoadingSpinner />;
  if (!recipe) return (
    <div className="error-state">
      <AlertCircle size={40} />
      <p>Recipe not found</p>
    </div>
  );

  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) ingredients.push({ ingredient, measure });
  }

  const handleAddToShoppingList = () => {
    addToShoppingList(ingredients);
    showToast('Ingredients added to shopping list');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: recipe.strMeal, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard');
    }
  };

  const favorited = isFavorite(recipe.idMeal);

  return (
    <div className="page recipe-detail-page">
      {toastMsg && (
        <div className="toast">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="recipe-detail">
        <div className="recipe-detail-header">
          <img src={recipe.strMealThumb} alt={recipe.strMeal} className="recipe-detail-image" />
          <div className="recipe-detail-info">
            <h1>{recipe.strMeal}</h1>
            <div className="recipe-meta">
              {recipe.strCategory && (
                <span className="meta-badge"><Tag size={12} /> {recipe.strCategory}</span>
              )}
              {recipe.strArea && (
                <span className="meta-badge"><Globe size={12} /> {recipe.strArea}</span>
              )}
            </div>

            <div className="recipe-actions">
              <button
                className={`btn-action ${favorited ? 'btn-action--active' : ''}`}
                onClick={() => favorited ? removeFavorite(recipe.idMeal) : addFavorite(recipe)}
              >
                <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
                {favorited ? 'Saved' : 'Save'}
              </button>
              <button className="btn-action" onClick={handleAddToShoppingList}>
                <ShoppingCart size={16} />
                Add to List
              </button>
              <button className="btn-action" onClick={handleShare}>
                <Share2 size={16} />
                Share
              </button>
            </div>

            <div className="servings-control">
              <label><Users size={14} /> Servings</label>
              <div className="servings-stepper">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  aria-label="Decrease servings"
                >
                  <Minus size={14} />
                </button>
                <span>{servings}</span>
                <button
                  onClick={() => setServings(servings + 1)}
                  aria-label="Increase servings"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="recipe-detail-content">
          <div className="ingredients-section">
            <h2><ClipboardList size={20} /> Ingredients</h2>
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
            <h2><ListChecks size={20} /> Instructions</h2>
            <div className="instructions-text">
              {recipe.strInstructions.split('\n').map((step, index) =>
                step.trim() && <p key={index}>{step}</p>
              )}
            </div>

            {recipe.strYoutube && (
              <div className="video-section">
                <h3>Video Tutorial</h3>
                <a href={recipe.strYoutube} target="_blank" rel="noopener noreferrer" className="video-link">
                  <Play size={16} />
                  Watch on YouTube
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Favorites = () => {
  const { favorites } = useRecipeStore();

  return (
    <div className="page favorites-page">
      <div className="page-header">
        <div>
          <h1>My Favorites</h1>
          <p className="subtitle">{favorites.length} saved recipe{favorites.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Heart size={48} /></div>
          <h2>No favorites yet</h2>
          <p>Start exploring recipes and save your favorites.</p>
          <Link to="/search" className="btn-primary">
            <SearchIcon size={16} />
            Browse Recipes
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

const MyRecipes = () => {
  const { myRecipes, addMyRecipe, removeMyRecipe } = useRecipeStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    strMeal: '', strCategory: '', strArea: '', strInstructions: '',
    strMealThumb: 'https://via.placeholder.com/400',
    ingredients: ['', '', '']
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addMyRecipe({ ...formData, idMeal: Date.now().toString() });
    setShowForm(false);
    setFormData({ strMeal: '', strCategory: '', strArea: '', strInstructions: '', strMealThumb: 'https://via.placeholder.com/400', ingredients: ['', '', ''] });
  };

  return (
    <div className="page my-recipes-page">
      <div className="page-header">
        <div>
          <h1>My Recipes</h1>
          <p className="subtitle">{myRecipes.length} custom recipe{myRecipes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          Add Recipe
        </button>
      </div>

      {showForm && (
        <div className="recipe-form-card">
          <h3><Pencil size={16} /> Create New Recipe</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <input
                type="text" placeholder="Recipe name" required
                value={formData.strMeal}
                onChange={(e) => setFormData({ ...formData, strMeal: e.target.value })}
              />
              <input
                type="text" placeholder="Category (e.g. Dessert)"
                value={formData.strCategory}
                onChange={(e) => setFormData({ ...formData, strCategory: e.target.value })}
              />
              <input
                type="text" placeholder="Cuisine (e.g. Italian)"
                value={formData.strArea}
                onChange={(e) => setFormData({ ...formData, strArea: e.target.value })}
              />
            </div>
            <textarea
              placeholder="Instructions…"
              rows={6} required
              value={formData.strInstructions}
              onChange={(e) => setFormData({ ...formData, strInstructions: e.target.value })}
            />
            <div className="form-actions">
              <button type="submit" className="btn-primary"><Save size={16} /> Save Recipe</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {myRecipes.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon"><BookOpen size={48} /></div>
          <h2>No custom recipes yet</h2>
          <p>Create your first recipe to get started.</p>
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
          <h1>Meal Planner</h1>
          <p className="subtitle">Plan your week ahead</p>
        </div>
      </div>

      <div className="meal-planner-grid">
        {getWeekDates().map((date) => (
          <div key={date} className="day-column">
            <div className="day-header">
              <h3>{new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short' })}</h3>
              <span>{new Date(date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>

            {meals.map((meal) => (
              <div key={meal} className="meal-slot">
                <div className="meal-slot-label">
                  <Utensils size={12} />
                  {meal}
                </div>
                {mealPlan[date]?.[meal] ? (
                  <div className="planned-meal">
                    <img src={mealPlan[date][meal].strMealThumb} alt={mealPlan[date][meal].strMeal} />
                    <p>{mealPlan[date][meal].strMeal}</p>
                    <button
                      onClick={() => removeMealFromPlan(date, meal)}
                      className="remove-meal-btn"
                      aria-label="Remove meal"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="add-meal-btn"
                    onClick={() => setShowRecipeSelector({ date, meal })}
                  >
                    <Plus size={14} />
                    <span>Add</span>
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
            <div className="modal-header">
              <h2>Select a Recipe</h2>
              <button className="modal-close" onClick={() => setShowRecipeSelector(null)}>
                <X size={20} />
              </button>
            </div>
            {favorites.length === 0 ? (
              <div className="inline-notice inline-notice--info">
                <Info size={18} />
                <span>No favorites yet. Save some recipes first.</span>
              </div>
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
          </div>
        </div>
      )}
    </div>
  );
};

const ShoppingList = () => {
  const { shoppingList, toggleShoppingItem, removeShoppingItem, clearCheckedItems, addToShoppingList } = useRecipeStore();
  const [newItemText, setNewItemText] = useState('');

  const handleAddManualItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    addToShoppingList([{ ingredient: newItemText.trim(), measure: '' }]);
    setNewItemText('');
  };

  const groupedItems = shoppingList.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const checkedCount = shoppingList.filter(i => i.checked).length;

  return (
    <div className="page shopping-list-page">
      <div className="page-header">
        <div>
          <h1>Shopping List</h1>
          {shoppingList.length > 0 && (
            <p className="subtitle">{shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''}{checkedCount > 0 ? ` · ${checkedCount} checked` : ''}</p>
          )}
        </div>
        {shoppingList.length > 0 && (
          <div className="header-actions">
            {checkedCount > 0 && (
              <button onClick={clearCheckedItems} className="btn-secondary">
                Clear checked
              </button>
            )}
            <button onClick={() => window.print()} className="btn-primary">
              <Printer size={16} />
              Print
            </button>
          </div>
        )}
      </div>

      <form className="add-item-form" onSubmit={handleAddManualItem}>
        <input
          type="text"
          placeholder="Add an item manually…"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          className="add-item-input"
        />
        <button type="submit" className="btn-primary" disabled={!newItemText.trim()}>
          <Plus size={16} /> Add
        </button>
      </form>

      {shoppingList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><ShoppingCart size={48} /></div>
          <h2>Shopping list is empty</h2>
          <p>Add ingredients from recipes, or type items above.</p>
        </div>
      ) : (
        <div className="shopping-list-content">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="shopping-category">
              <h3 className="category-heading">{category}</h3>
              <ul>
                {items.map((item) => (
                  <li key={item.id} className={`shopping-item ${item.checked ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleShoppingItem(item.id)}
                    />
                    <span className="item-name">{item.amount} {item.name}</span>
                    <button
                      onClick={() => removeShoppingItem(item.id)}
                      className="remove-item-btn"
                      aria-label="Remove item"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Cookbook = () => {
  const { cookbooks, favorites, createCookbook, deleteCookbook } = useRecipeStore();
  const [showForm, setShowForm] = useState(false);
  const [cookbookName, setCookbookName] = useState('');
  const [selectedRecipes, setSelectedRecipes] = useState([]);

  const handleCreate = () => {
    if (cookbookName && selectedRecipes.length > 0) {
      const recipes = favorites.filter(r => selectedRecipes.includes(r.idMeal));
      createCookbook(cookbookName, recipes);
      setShowForm(false);
      setCookbookName('');
      setSelectedRecipes([]);
    }
  };

  return (
    <div className="page cookbook-page">
      <div className="page-header">
        <div>
          <h1>My Cookbooks</h1>
          <p className="subtitle">{cookbooks.length} cookbook{cookbooks.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          New Cookbook
        </button>
      </div>

      {showForm && (
        <div className="recipe-form-card">
          <h3><BookMarked size={16} /> Create Cookbook</h3>
          <input
            type="text" placeholder="Cookbook title"
            value={cookbookName}
            onChange={(e) => setCookbookName(e.target.value)}
          />
          {favorites.length === 0 ? (
            <div className="inline-notice inline-notice--info">
              <Info size={16} />
              <span>Save some favorites first to add to a cookbook.</span>
            </div>
          ) : (
            <>
              <p className="form-label">Select recipes from your favorites</p>
              <div className="recipe-selection-grid">
                {favorites.map((recipe) => (
                  <label key={recipe.idMeal} className={`recipe-checkbox ${selectedRecipes.includes(recipe.idMeal) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedRecipes.includes(recipe.idMeal)}
                      onChange={(e) => {
                        setSelectedRecipes(e.target.checked
                          ? [...selectedRecipes, recipe.idMeal]
                          : selectedRecipes.filter(id => id !== recipe.idMeal)
                        );
                      }}
                    />
                    <img src={recipe.strMealThumb} alt={recipe.strMeal} />
                    <span>{recipe.strMeal}</span>
                  </label>
                ))}
              </div>
            </>
          )}
          <div className="form-actions">
            <button onClick={handleCreate} className="btn-primary" disabled={!cookbookName || selectedRecipes.length === 0}>
              <Save size={16} /> Create
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      )}

      {cookbooks.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon"><Library size={48} /></div>
          <h2>No cookbooks yet</h2>
          <p>Create your first cookbook collection.</p>
        </div>
      ) : (
        <div className="cookbook-grid">
          {cookbooks.map((cookbook) => (
            <div key={cookbook.id} className="cookbook-card">
              <div className="cookbook-preview">
                {cookbook.recipes.slice(0, 4).map((recipe) => (
                  <img key={recipe.idMeal} src={recipe.strMealThumb} alt={recipe.strMeal} />
                ))}
                {cookbook.recipes.length < 4 && Array(4 - cookbook.recipes.length).fill(0).map((_, i) => (
                  <div key={i} className="cookbook-preview-placeholder" />
                ))}
              </div>
              <div className="cookbook-card-info">
                <h3>{cookbook.name}</h3>
                <p>{cookbook.recipes.length} recipe{cookbook.recipes.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => deleteCookbook(cookbook.id)} className="btn-danger-sm" aria-label="Delete cookbook">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============ MAIN APP ============
const App = () => {
  const { theme } = useRecipeStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/my-recipes" element={<MyRecipes />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/shopping-list" element={<ShoppingList />} />
            <Route path="/cookbook" element={<Cookbook />} />
          </Routes>
        </main>
        <BottomNav />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

        *, *::before, *::after {
          margin: 0; padding: 0; box-sizing: border-box;
        }

        :root {
          --font-display: 'Sora', sans-serif;
          --font-body: 'DM Sans', sans-serif;

          --color-accent: #E05A2B;
          --color-accent-light: #F2784B;
          --color-accent-muted: #FDF0EB;
          --color-green: #2C7A4B;
          --color-green-muted: #EBF7F1;

          --bg-canvas: #FAFAF8;
          --bg-surface: #FFFFFF;
          --bg-raised: #F4F4F0;
          --bg-border: #E8E8E4;

          --text-primary: #1A1A18;
          --text-secondary: #6B6B65;
          --text-muted: #9D9D96;

          --shadow-xs: 0 1px 2px rgba(0,0,0,0.06);
          --shadow-sm: 0 2px 6px rgba(0,0,0,0.08);
          --shadow-md: 0 4px 16px rgba(0,0,0,0.10);
          --shadow-lg: 0 12px 32px rgba(0,0,0,0.12);

          --sidebar-width: 248px;
          --radius-sm: 6px;
          --radius-md: 10px;
          --radius-lg: 16px;
          --radius-xl: 24px;

          --transition: 0.2s ease;
        }

        [data-theme="dark"] {
          --bg-canvas: #111110;
          --bg-surface: #1C1C1A;
          --bg-raised: #252522;
          --bg-border: #333330;
          --text-primary: #F0F0EC;
          --text-secondary: #9D9D96;
          --text-muted: #6B6B65;
          --color-accent-muted: #2A1810;
          --color-green-muted: #0F2318;
        }

        body {
          font-family: var(--font-body);
          background: var(--bg-canvas);
          color: var(--text-primary);
          line-height: 1.6;
          font-size: 15px;
        }

        .app-container {
          display: flex;
          min-height: 100vh;
        }

        /* ===== SIDEBAR ===== */
        .sidebar {
          width: var(--sidebar-width);
          background: var(--bg-surface);
          border-right: 1px solid var(--bg-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          overflow-y: auto;
          z-index: 100;
        }

        .sidebar-header {
          padding: 1.5rem 1.25rem 1.25rem;
          border-bottom: 1px solid var(--bg-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .logo-mark {
          width: 36px;
          height: 36px;
          background: var(--color-accent);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .logo-text {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .theme-toggle {
          width: 34px;
          height: 34px;
          background: var(--bg-raised);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          transition: var(--transition);
        }

        .theme-toggle:hover {
          background: var(--bg-border);
          color: var(--text-primary);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: var(--transition);
          font-size: 0.9rem;
          font-weight: 500;
          position: relative;
        }

        .nav-item:hover {
          background: var(--bg-raised);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--color-accent-muted);
          color: var(--color-accent);
          font-weight: 600;
        }

        .nav-icon { display: flex; align-items: center; flex-shrink: 0; }
        .nav-label { flex: 1; }
        .nav-chevron { margin-left: auto; opacity: 0.6; }

        .sidebar-footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--bg-border);
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .footer-heart { color: var(--color-accent); flex-shrink: 0; }

        /* ===== BOTTOM NAV — hidden everywhere, drawer replaces it on mobile ===== */
        .bottom-nav { display: none; }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          flex: 1;
          margin-left: var(--sidebar-width);
          padding: 2rem 2.5rem;
          max-width: calc(100vw - var(--sidebar-width));
        }

        .page { max-width: 1320px; margin: 0 auto; }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--bg-border);
        }

        .page-header h1 {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--text-primary);
        }

        .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
        .header-actions { display: flex; gap: 0.75rem; align-items: center; }

        /* ===== BUTTONS ===== */
        .btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: var(--color-accent); color: white;
          border: none; border-radius: var(--radius-sm);
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; transition: var(--transition);
          text-decoration: none;
          font-family: var(--font-body);
        }

        .btn-primary:hover { background: var(--color-accent-light); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; pointer-events: none; }

        .btn-secondary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: var(--bg-raised); color: var(--text-primary);
          border: 1px solid var(--bg-border); border-radius: var(--radius-sm);
          font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: var(--transition);
          font-family: var(--font-body);
        }

        .btn-secondary:hover { background: var(--bg-border); }

        .btn-action {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1.5px solid var(--bg-border); background: transparent;
          color: var(--text-secondary); border-radius: var(--radius-sm);
          font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: var(--transition);
          font-family: var(--font-body);
        }

        .btn-action:hover { border-color: var(--color-accent); color: var(--color-accent); }
        .btn-action--active { background: var(--color-accent); border-color: var(--color-accent); color: white; }
        .btn-action--active:hover { background: var(--color-accent-light); }

        .btn-danger-sm {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
          background: transparent; border: 1px solid var(--bg-border);
          color: var(--text-muted); border-radius: var(--radius-sm);
          cursor: pointer; transition: var(--transition);
          flex-shrink: 0;
        }

        .btn-danger-sm:hover { background: #FEE2E2; border-color: #FCA5A5; color: #DC2626; }

        /* ===== HERO ===== */
        .hero-section {
          background: linear-gradient(135deg, #1A1A18 0%, #2D2D28 100%);
          border-radius: var(--radius-xl);
          padding: 4rem 3rem;
          color: white;
          margin-bottom: 3rem;
          position: relative;
          overflow: hidden;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 280px; height: 280px;
          background: var(--color-accent);
          border-radius: 50%;
          opacity: 0.12;
        }

        .hero-section::after {
          content: '';
          position: absolute;
          bottom: -80px; left: 30%;
          width: 220px; height: 220px;
          background: var(--color-accent-light);
          border-radius: 50%;
          opacity: 0.08;
        }

        .hero-content { max-width: 680px; position: relative; z-index: 1; }

        .hero-title {
          font-family: var(--font-display);
          font-size: 3rem; font-weight: 800;
          letter-spacing: -0.04em; line-height: 1.1;
          margin-bottom: 1rem;
        }

        .hero-subtitle {
          font-size: 1.1rem; opacity: 0.8;
          margin-bottom: 2rem; line-height: 1.6;
        }

        .hero-features {
          display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.75rem;
        }

        .feature-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 0.375rem 0.875rem;
          border-radius: 100px;
          font-size: 0.8rem; font-weight: 500;
        }

        /* ===== SEARCH BAR ===== */
        .search-bar {
          display: flex; gap: 0.75rem; max-width: 580px;
        }

        .search-input-wrapper {
          flex: 1; position: relative; display: flex; align-items: center;
        }

        .search-icon-prefix {
          position: absolute; left: 1rem;
          color: rgba(255,255,255,0.5); pointer-events: none;
        }

        .search-input {
          width: 100%; padding: 0.875rem 1rem 0.875rem 2.75rem;
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: var(--radius-sm);
          background: rgba(255,255,255,0.12);
          color: white; font-size: 0.95rem;
          font-family: var(--font-body);
          transition: var(--transition);
        }

        .search-input::placeholder { color: rgba(255,255,255,0.4); }
        .search-input:focus { outline: none; border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.18); }

        .search-bar-container .search-input {
          background: var(--bg-surface); color: var(--text-primary);
          border-color: var(--bg-border);
        }

        .search-bar-container .search-input::placeholder { color: var(--text-muted); }
        .search-bar-container .search-icon-prefix { color: var(--text-muted); }

        .search-btn {
          padding: 0.875rem 1.5rem;
          background: white; color: var(--color-accent);
          border: none; border-radius: var(--radius-sm);
          font-size: 0.9rem; font-weight: 700;
          cursor: pointer; transition: var(--transition);
          font-family: var(--font-body); white-space: nowrap;
        }

        .search-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }

        .search-bar-container .search-btn {
          background: var(--color-accent); color: white;
        }

        .search-bar-container { margin-bottom: 2rem; }

        /* ===== SECTION HEADERS ===== */
        .section-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-family: var(--font-display);
          font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em;
        }

        .section-link {
          display: inline-flex; align-items: center; gap: 0.25rem;
          color: var(--color-accent); text-decoration: none;
          font-size: 0.85rem; font-weight: 600;
          transition: var(--transition);
        }

        .section-link:hover { opacity: 0.8; }

        .featured-section { margin-bottom: 3.5rem; }
        .features-detail-section { margin-top: 1rem; }
        .features-detail-section .section-title { margin-bottom: 1.5rem; }

        /* ===== RECIPE GRID ===== */
        .recipe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.5rem;
        }

        .recipe-card {
          background: var(--bg-surface);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: var(--transition);
        }

        .recipe-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: transparent;
        }

        .recipe-card-image {
          position: relative; width: 100%; aspect-ratio: 1; overflow: hidden;
        }

        .recipe-card-image img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.3s ease;
        }

        .recipe-card:hover .recipe-card-image img { transform: scale(1.04); }

        .favorite-btn {
          position: absolute; top: 0.75rem; right: 0.75rem;
          background: var(--bg-surface);
          border: 1px solid var(--bg-border);
          width: 34px; height: 34px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: var(--transition);
          color: var(--text-muted);
        }

        .favorite-btn:hover { color: var(--color-accent); border-color: var(--color-accent); }
        .favorite-btn.active { color: var(--color-accent); background: var(--color-accent-muted); border-color: var(--color-accent); }

        .recipe-card-content { padding: 1rem 1.125rem 1.125rem; }

        .recipe-card-content h3 {
          font-family: var(--font-display);
          font-size: 0.95rem; font-weight: 600; letter-spacing: -0.01em;
          line-height: 1.4; margin-bottom: 0.625rem;
        }

        .recipe-card-meta { display: flex; gap: 0.375rem; flex-wrap: wrap; }

        .tag {
          background: var(--bg-raised);
          padding: 0.2rem 0.6rem;
          border-radius: 100px;
          font-size: 0.72rem; font-weight: 500;
          color: var(--text-secondary);
        }

        .tag-secondary { background: var(--color-green-muted); color: var(--color-green); }

        /* ===== FEATURES GRID ===== */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }

        .feature-card {
          background: var(--bg-surface);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          transition: var(--transition);
        }

        .feature-card:hover { box-shadow: var(--shadow-sm); transform: translateY(-2px); }

        .feature-card-icon {
          width: 48px; height: 48px;
          background: var(--color-accent-muted);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          color: var(--color-accent);
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-family: var(--font-display);
          font-size: 0.95rem; font-weight: 700;
          margin-bottom: 0.375rem; letter-spacing: -0.01em;
        }

        .feature-card p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }

        /* ===== LOADING & NOTICES ===== */
        .loading-spinner {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 1rem;
          min-height: 300px;
          color: var(--text-secondary);
        }

        .spin-icon { animation: spin 1.2s linear infinite; color: var(--color-accent); }
        @keyframes spin { to { transform: rotate(360deg); } }

        .inline-notice {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem; margin-bottom: 1.5rem;
        }

        .inline-notice--warning {
          background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A;
        }

        .inline-notice--info {
          background: var(--bg-raised); color: var(--text-secondary); border: 1px solid var(--bg-border);
        }

        /* ===== EMPTY STATE ===== */
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 0.75rem;
          padding: 5rem 2rem; text-align: center;
        }

        .empty-icon { color: var(--text-muted); margin-bottom: 0.5rem; }

        .empty-state h2 {
          font-family: var(--font-display);
          font-size: 1.25rem; font-weight: 700; color: var(--text-primary);
        }

        .empty-state p { color: var(--text-secondary); font-size: 0.9rem; max-width: 320px; }

        /* ===== RECIPE DETAIL ===== */
        .back-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          margin-bottom: 1.5rem;
          background: var(--bg-surface); border: 1px solid var(--bg-border);
          color: var(--text-secondary);
          padding: 0.5rem 1rem; border-radius: var(--radius-sm);
          font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: var(--transition);
          font-family: var(--font-body);
        }

        .back-btn:hover { background: var(--bg-raised); color: var(--text-primary); }

        .recipe-detail {
          background: var(--bg-surface);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .recipe-detail-header {
          display: grid; grid-template-columns: 420px 1fr;
          gap: 0;
        }

        .recipe-detail-image {
          width: 100%; height: 420px;
          object-fit: cover; display: block;
        }

        .recipe-detail-info {
          padding: 2.5rem;
          display: flex; flex-direction: column; gap: 1.5rem;
        }

        .recipe-detail-info h1 {
          font-family: var(--font-display);
          font-size: 2rem; font-weight: 800; letter-spacing: -0.04em;
          line-height: 1.2;
        }

        .recipe-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; }

        .meta-badge {
          display: inline-flex; align-items: center; gap: 0.375rem;
          background: var(--bg-raised); border: 1px solid var(--bg-border);
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          font-size: 0.78rem; font-weight: 500;
          color: var(--text-secondary);
        }

        .recipe-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

        .servings-control {
          display: flex; align-items: center; gap: 1rem;
          font-size: 0.875rem; font-weight: 500; color: var(--text-secondary);
        }

        .servings-stepper {
          display: flex; align-items: center; gap: 0;
          border: 1px solid var(--bg-border); border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .servings-stepper button {
          width: 34px; height: 34px;
          background: var(--bg-raised); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: var(--transition);
          color: var(--text-secondary);
        }

        .servings-stepper button:hover { background: var(--bg-border); color: var(--text-primary); }

        .servings-stepper span {
          min-width: 40px; text-align: center;
          padding: 0 0.5rem;
          font-weight: 700; font-size: 1rem; color: var(--text-primary);
          border-left: 1px solid var(--bg-border);
          border-right: 1px solid var(--bg-border);
          line-height: 34px;
        }

        .recipe-detail-content {
          display: grid; grid-template-columns: 280px 1fr;
          border-top: 1px solid var(--bg-border);
        }

        .ingredients-section {
          padding: 2rem;
          border-right: 1px solid var(--bg-border);
        }

        .ingredients-section h2,
        .instructions-section h2 {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: var(--font-display);
          font-size: 1rem; font-weight: 700; letter-spacing: -0.01em;
          margin-bottom: 1rem; color: var(--text-primary);
        }

        .ingredients-list { list-style: none; }

        .ingredients-list li {
          display: flex; justify-content: space-between; align-items: baseline;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--bg-border);
          font-size: 0.875rem; gap: 1rem;
        }

        .ingredients-list li:last-child { border-bottom: none; }

        .ingredient-measure { color: var(--color-accent); font-weight: 600; white-space: nowrap; }
        .ingredient-name { color: var(--text-primary); }

        .instructions-section { padding: 2rem; }

        .instructions-text p {
          margin-bottom: 0.875rem; line-height: 1.75;
          font-size: 0.9rem; color: var(--text-primary);
        }

        .video-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--bg-border); }

        .video-section h3 {
          font-family: var(--font-display);
          font-size: 0.9rem; font-weight: 700; margin-bottom: 0.75rem;
        }

        .video-link {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.25rem;
          background: #FF0000; color: white;
          text-decoration: none; border-radius: var(--radius-sm);
          font-size: 0.85rem; font-weight: 600;
          transition: var(--transition);
        }

        .video-link:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ===== TOAST ===== */
        .toast {
          position: fixed; top: 1.5rem; right: 1.5rem;
          display: flex; align-items: center; gap: 0.625rem;
          background: var(--text-primary); color: var(--bg-surface);
          padding: 0.75rem 1.25rem; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500;
          z-index: 9999;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* ===== FORMS ===== */
        .recipe-form-card {
          background: var(--bg-surface);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          margin-bottom: 2rem;
        }

        .recipe-form-card h3 {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: var(--font-display);
          font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem;
        }

        .form-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem; margin-bottom: 0.75rem;
        }

        .form-label { font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.75rem; }

        .recipe-form-card input,
        .recipe-form-card textarea {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1.5px solid var(--bg-border);
          border-radius: var(--radius-sm);
          background: var(--bg-canvas);
          color: var(--text-primary);
          font-size: 0.875rem;
          font-family: var(--font-body);
          transition: var(--transition);
        }

        .recipe-form-card input:focus,
        .recipe-form-card textarea:focus {
          outline: none; border-color: var(--color-accent);
          background: var(--bg-surface);
        }

        .recipe-form-card textarea { resize: vertical; margin-bottom: 0.75rem; }

        .cookbook-form input { margin-bottom: 1rem; }

        .form-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }

        /* ===== MEAL PLANNER ===== */
        .meal-planner-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .day-column {
          background: var(--bg-surface);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          min-width: 130px;
        }

        .day-header {
          padding: 0.75rem;
          background: var(--bg-raised);
          border-bottom: 1px solid var(--bg-border);
          text-align: center;
        }

        .day-header h3 {
          font-family: var(--font-display);
          font-size: 0.85rem; font-weight: 700; color: var(--text-primary);
        }

        .day-header span { font-size: 0.75rem; color: var(--text-muted); }

        .meal-slot { padding: 0.625rem; border-bottom: 1px solid var(--bg-border); }
        .meal-slot:last-child { border-bottom: none; }

        .meal-slot-label {
          display: flex; align-items: center; gap: 0.375rem;
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.375rem;
        }

        .planned-meal {
          position: relative;
        }

        .planned-meal img {
          width: 100%; border-radius: var(--radius-sm);
          aspect-ratio: 1; object-fit: cover; display: block;
        }

        .planned-meal p {
          font-size: 0.72rem; font-weight: 500; color: var(--text-primary);
          margin-top: 0.25rem; line-height: 1.3;
        }

        .remove-meal-btn {
          position: absolute; top: 0.25rem; right: 0.25rem;
          width: 20px; height: 20px;
          background: rgba(0,0,0,0.5); color: white;
          border: none; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: var(--transition);
        }

        .remove-meal-btn:hover { background: rgba(0,0,0,0.7); }

        .add-meal-btn {
          width: 100%; padding: 0.5rem;
          background: var(--bg-canvas); border: 1.5px dashed var(--bg-border);
          color: var(--text-muted); border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center; gap: 0.25rem;
          font-size: 0.75rem; font-weight: 500;
          cursor: pointer; transition: var(--transition);
          font-family: var(--font-body);
        }

        .add-meal-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1.5rem;
        }

        .modal-content {
          background: var(--bg-surface);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          max-width: 560px; width: 100%;
          max-height: 80vh; overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }

        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          font-family: var(--font-display);
          font-size: 1.125rem; font-weight: 700;
        }

        .modal-close {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); transition: var(--transition);
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: var(--radius-sm);
        }

        .modal-close:hover { background: var(--bg-raised); color: var(--text-primary); }

        .recipe-selector-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem;
        }

        .recipe-selector-item {
          cursor: pointer; border-radius: var(--radius-sm); overflow: hidden;
          border: 1.5px solid var(--bg-border); transition: var(--transition);
        }

        .recipe-selector-item:hover { border-color: var(--color-accent); transform: translateY(-2px); }
        .recipe-selector-item img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
        .recipe-selector-item p { font-size: 0.72rem; font-weight: 500; padding: 0.375rem; line-height: 1.3; }

        /* ===== SHOPPING LIST ===== */
        .shopping-list-content { display: flex; flex-direction: column; gap: 1.5rem; }

        .shopping-category {
          background: var(--bg-surface);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .category-heading {
          padding: 0.75rem 1.25rem;
          background: var(--bg-raised);
          border-bottom: 1px solid var(--bg-border);
          font-family: var(--font-display);
          font-size: 0.8rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-secondary);
        }

        .shopping-category ul { list-style: none; }

        .shopping-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid var(--bg-border);
          transition: var(--transition);
        }

        .shopping-item:last-child { border-bottom: none; }
        .shopping-item.checked .item-name { text-decoration: line-through; color: var(--text-muted); }

        .shopping-item input[type="checkbox"] {
          width: 17px; height: 17px; flex-shrink: 0;
          accent-color: var(--color-accent); cursor: pointer;
        }

        .item-name { flex: 1; font-size: 0.875rem; }

        .remove-item-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); transition: var(--transition);
          display: flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 4px;
          flex-shrink: 0;
        }

        .remove-item-btn:hover { background: #FEE2E2; color: #DC2626; }

        /* ===== COOKBOOKS ===== */
        .cookbook-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .cookbook-card {
          background: var(--bg-surface);
          border: 1px solid var(--bg-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: var(--transition);
          position: relative;
        }

        .cookbook-card:hover { box-shadow: var(--shadow-md); transform: translateY(-3px); }

        .cookbook-preview {
          display: grid; grid-template-columns: 1fr 1fr;
          aspect-ratio: 1;
        }

        .cookbook-preview img {
          width: 100%; height: 100%; object-fit: cover;
        }

        .cookbook-preview-placeholder { background: var(--bg-raised); }

        .cookbook-card-info { padding: 0.875rem 1rem; }

        .cookbook-card-info h3 {
          font-family: var(--font-display);
          font-size: 0.9rem; font-weight: 700; margin-bottom: 0.2rem;
        }

        .cookbook-card-info p { font-size: 0.78rem; color: var(--text-muted); }

        .cookbook-card .btn-danger-sm {
          position: absolute; top: 0.5rem; right: 0.5rem;
        }

        .recipe-selection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.75rem; margin-bottom: 1rem;
        }

        .recipe-checkbox {
          display: block; cursor: pointer;
          border: 1.5px solid var(--bg-border);
          border-radius: var(--radius-sm); overflow: hidden;
          transition: var(--transition);
          position: relative;
        }

        .recipe-checkbox.selected { border-color: var(--color-accent); }
        .recipe-checkbox input { position: absolute; opacity: 0; pointer-events: none; }
        .recipe-checkbox img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
        .recipe-checkbox span { display: block; font-size: 0.72rem; font-weight: 500; padding: 0.375rem; line-height: 1.3; }

        /* ===== ERROR STATE ===== */
        .error-state {
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
          padding: 5rem; text-align: center; color: var(--text-secondary);
        }

        /* ===== MOBILE HEADER ===== */
        .mobile-header {
          display: none;
          position: fixed; top: 0; left: 0; right: 0;
          height: 56px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--bg-border);
          padding: 0 1rem;
          align-items: center; justify-content: space-between;
          z-index: 200;
          box-shadow: var(--shadow-xs);
        }

        .mobile-menu-btn {
          width: 38px; height: 38px;
          background: var(--bg-raised); border: 1px solid var(--bg-border);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-primary);
          transition: var(--transition);
        }

        .mobile-menu-btn:hover { background: var(--bg-border); }

        .mobile-logo {
          display: flex; align-items: center; gap: 0.5rem;
          position: absolute; left: 50%; transform: translateX(-50%);
        }

        .logo-mark--sm {
          width: 28px; height: 28px;
          background: var(--color-accent);
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          color: white;
        }

        /* ===== MOBILE DRAWER ===== */
        .drawer-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(2px);
          z-index: 300;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .mobile-drawer {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 280px;
          background: var(--bg-surface);
          border-right: 1px solid var(--bg-border);
          display: flex; flex-direction: column;
          z-index: 400;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-lg);
        }

        .mobile-drawer.open { transform: translateX(0); }

        .drawer-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--bg-border);
          display: flex; align-items: center; justify-content: space-between;
          min-height: 56px;
        }

        .drawer-close {
          width: 34px; height: 34px;
          background: var(--bg-raised); border: 1px solid var(--bg-border);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-secondary);
          transition: var(--transition);
        }

        .drawer-close:hover { background: var(--bg-border); color: var(--text-primary); }

        .drawer-nav {
          flex: 1; overflow-y: auto;
          padding: 0.75rem;
          display: flex; flex-direction: column; gap: 2px;
        }

        .drawer-nav-item {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 0.75rem 1rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          font-size: 0.95rem; font-weight: 500;
          transition: var(--transition);
        }

        .drawer-nav-item:hover { background: var(--bg-raised); color: var(--text-primary); }
        .drawer-nav-item.active { background: var(--color-accent-muted); color: var(--color-accent); font-weight: 600; }
        .drawer-nav-item .nav-chevron { margin-left: auto; }

        .drawer-footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--bg-border);
        }

        .drawer-theme-btn {
          display: flex; align-items: center; gap: 0.625rem;
          width: 100%; padding: 0.625rem 0.875rem;
          background: var(--bg-raised); border: 1px solid var(--bg-border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary); font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: var(--transition);
          font-family: var(--font-body);
        }

        .drawer-theme-btn:hover { background: var(--bg-border); color: var(--text-primary); }

        /* ===== ADD ITEM FORM (Shopping List) ===== */
        .add-item-form {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--bg-surface);
          border: 1.5px solid var(--bg-border);
          border-radius: var(--radius-md);
          padding: 0.5rem 0.5rem 0.5rem 1.125rem;
          margin-bottom: 2rem;
          transition: border-color var(--transition), box-shadow var(--transition);
        }

        .add-item-form:focus-within {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(224, 90, 43, 0.1);
        }

        .add-item-input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9rem;
          outline: none;
          padding: 0.375rem 0;
          min-width: 0;
        }

        .add-item-input::placeholder { color: var(--text-muted); }

        .add-item-form .btn-primary {
          padding: 0.5rem 1.125rem;
          border-radius: calc(var(--radius-sm) - 1px);
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          :root { --sidebar-width: 200px; }
          .main-content { padding: 1.5rem 2rem; }
          .meal-planner-grid { grid-template-columns: repeat(4, 1fr); }
          .recipe-detail-header { grid-template-columns: 1fr; }
          .recipe-detail-image { height: 280px; }
          .recipe-detail-content { grid-template-columns: 1fr; }
          .ingredients-section { border-right: none; border-bottom: 1px solid var(--bg-border); }
          .hero-title { font-size: 2.25rem; }
        }

        @media (max-width: 768px) {
          :root { --sidebar-width: 0px; }
          .sidebar { display: none; }
          .mobile-header { display: flex; }
          .main-content {
            margin-left: 0;
            padding: 1rem 1.25rem 2.5rem;
            max-width: 100vw;
            padding-top: calc(56px + 1.25rem);
          }
          .hero-section { padding: 2.5rem 1.5rem; border-radius: var(--radius-lg); }
          .hero-title { font-size: 1.75rem; }
          .hero-subtitle { font-size: 0.95rem; }
          .hero-features { gap: 0.5rem; }
          .search-bar { flex-direction: column; }
          .search-btn { width: 100%; }
          .recipe-grid { grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
          .meal-planner-grid { grid-template-columns: repeat(3, 1fr); }
          .page-header { flex-direction: column; gap: 0.75rem; }
          .page-header h1 { font-size: 1.5rem; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .recipe-detail-header { grid-template-columns: 1fr; }
          .recipe-detail-info { padding: 1.5rem; }
          .recipe-actions { flex-direction: column; }
          .recipe-actions .btn-action { justify-content: center; }
          .add-item-form { margin-bottom: 1.5rem; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: 1.5rem; }
          .recipe-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .meal-planner-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media print {
          .sidebar, .mobile-header, .back-btn, .recipe-actions, .page-header button { display: none; }
          .main-content { margin-left: 0; padding: 0; }
        }
      `}</style>
    </Router>
  );
};

export default App;
