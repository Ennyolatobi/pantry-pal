/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Home as HomeIcon, Search as SearchIcon, Heart, BookOpen, Calendar,
  ShoppingCart, Library, Sun, Moon, ArrowLeft, Plus, Minus, X, Share2,
  Tag, Globe, Users, Printer, Play, ChevronRight, UtensilsCrossed, Utensils,
  ListChecks, CalendarCheck, ClipboardList, CheckCircle2, AlertCircle, Info,
  Loader2, Pencil, Trash2, BookMarked, Save, Menu, Clock, Flame, Github,
  Linkedin, Mail, ExternalLink, Filter, Wallet, ChefHat, MapPin, Leaf,
  TrendingUp, Mic, Refrigerator
} from 'lucide-react';
import {
  searchAllRecipes, getRecipeById, getRandomMealDbRecipes,
  NIGERIAN_RECIPES, AFRICAN_RECIPES, ALL_LOCAL_RECIPES,
  getByTribe, getByCountry, getBreakfast, getBudgetMeals,
  getTrending, filterByMaxBudget, pantryMatch
} from './services/recipeService.js';

// ─── STORE ────────────────────────────────────────────────────────────────────
const useRecipeStore = create(persist((set, get) => ({
  favorites: [], myRecipes: [], shoppingList: [], mealPlan: {},
  cookbooks: [], recentlyViewed: [], theme: 'light',

  toggleTheme: () => set(s => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),

  addRecentlyViewed: (r) => set(s => {
    const filtered = s.recentlyViewed.filter(x => x.idMeal !== r.idMeal);
    return { recentlyViewed: [r, ...filtered].slice(0, 12) };
  }),

  addFavorite: (r) => set(s =>
    s.favorites.find(f => f.idMeal === r.idMeal) ? s : { favorites: [...s.favorites, r] }
  ),
  removeFavorite: (id) => set(s => ({ favorites: s.favorites.filter(f => f.idMeal !== id) })),
  isFavorite: (id) => get().favorites.some(f => f.idMeal === id),

  addToShoppingList: (items) => set(s => ({
    shoppingList: [...s.shoppingList, ...items.map(item => ({
      id: Date.now() + Math.random(),
      name: item.ingredient, amount: item.measure,
      checked: false, category: categoriseIngredient(item.ingredient)
    }))]
  })),
  toggleShoppingItem: (id) => set(s => ({
    shoppingList: s.shoppingList.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
  })),
  removeShoppingItem: (id) => set(s => ({ shoppingList: s.shoppingList.filter(i => i.id !== id) })),
  clearCheckedItems: () => set(s => ({ shoppingList: s.shoppingList.filter(i => !i.checked) })),

  addMealToPlan: (date, meal, recipe) => set(s => ({
    mealPlan: { ...s.mealPlan, [date]: { ...s.mealPlan[date], [meal]: recipe } }
  })),
  removeMealFromPlan: (date, meal) => set(s => {
    const p = { ...s.mealPlan };
    if (p[date]) { delete p[date][meal]; if (!Object.keys(p[date]).length) delete p[date]; }
    return { mealPlan: p };
  }),

  addMyRecipe: (r) => set(s => ({ myRecipes: [...s.myRecipes, { ...r, idMeal: Date.now().toString() }] })),
  removeMyRecipe: (id) => set(s => ({ myRecipes: s.myRecipes.filter(r => r.idMeal !== id) })),

  createCookbook: (name, recipes) => set(s => ({
    cookbooks: [...s.cookbooks, { id: Date.now().toString(), name, recipes, createdAt: new Date().toISOString() }]
  })),
  deleteCookbook: (id) => set(s => ({ cookbooks: s.cookbooks.filter(c => c.id !== id) })),
}), { name: 'pantrypal-storage' }));

const categoriseIngredient = (ing) => {
  const map = {
    Produce: ['lettuce','tomato','onion','garlic','pepper','carrot','potato','celery','plantain','yam','okra','spinach','leaves','ugu','waterleaf'],
    Meat: ['chicken','beef','pork','lamb','turkey','bacon','sausage','goat','fish','shrimp','prawn','crayfish','periwinkle'],
    Dairy: ['milk','cheese','butter','cream','yogurt','eggs','egg'],
    Pantry: ['flour','sugar','salt','oil','vinegar','rice','pasta','garri','egusi','ogbono','palm oil','seasoning','stock'],
    Spices: ['cumin','paprika','oregano','basil','thyme','cinnamon','curry','ginger','pepper','nutmeg','cloves','iru'],
  };
  const l = ing.toLowerCase();
  for (const [cat, words] of Object.entries(map)) {
    if (words.some(w => l.includes(w))) return cat;
  }
  return 'Other';
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const ALL_NAV_ITEMS = [
  { path: '/',              icon: HomeIcon,     label: 'Home' },
  { path: '/explore',       icon: Flame,        label: 'African Kitchen' },
  { path: '/search',        icon: SearchIcon,   label: 'Search' },
  { path: '/favorites',     icon: Heart,        label: 'Favorites' },
  { path: '/my-recipes',    icon: BookOpen,     label: 'My Recipes' },
  { path: '/meal-planner',  icon: Calendar,     label: 'Meal Planner' },
  { path: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
  { path: '/cookbook',      icon: Library,      label: 'Cookbooks' },
  { path: '/budget',        icon: Wallet,       label: 'Budget Meals' },
  { path: '/pantry',        icon: Refrigerator, label: 'Pantry Match' },
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const ThemeToggle = () => {
  const { theme, toggleTheme } = useRecipeStore();
  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
    </button>
  );
};

const LoadingSpinner = ({ text = 'Loading recipes…' }) => (
  <div className="loading-spinner">
    <Loader2 size={32} className="spin-icon"/>
    <p>{text}</p>
  </div>
);

const EmptyState = ({ icon: Icon = SearchIcon, title, body, action }) => (
  <div className="empty-state">
    <div className="empty-icon"><Icon size={48}/></div>
    <h2>{title}</h2>
    {body && <p>{body}</p>}
    {action}
  </div>
);

const SourceBadge = ({ source }) => {
  if (!source || source === 'mealdb') return null;
  const label = source === 'local' ? 'Local Recipe' : source;
  return <span className={`source-badge source-badge--${source}`}>{label}</span>;
};

const BudgetBadge = ({ estimate }) => {
  if (!estimate?.average) return null;
  return (
    <span className="budget-badge">
      ₦{estimate.average.toLocaleString()}
    </span>
  );
};

const RecipeCard = ({ recipe, showActions = true }) => {
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useRecipeStore();
  const fav = isFavorite(recipe.idMeal);

  return (
    <div className="recipe-card" onClick={() => navigate(`/recipe/${recipe.idMeal}`)}>
      <div className="recipe-card-image">
        <img src={recipe.strMealThumb} alt={recipe.strMeal} loading="lazy"/>
        {showActions && (
          <button
            className={`favorite-btn ${fav ? 'active' : ''}`}
            onClick={e => { e.stopPropagation(); fav ? removeFavorite(recipe.idMeal) : addFavorite(recipe); }}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={16} fill={fav ? 'currentColor' : 'none'}/>
          </button>
        )}
        {recipe._source === 'local' && <span className="card-local-badge">African</span>}
      </div>
      <div className="recipe-card-content">
        <h3>{recipe.strMeal}</h3>
        <div className="recipe-card-meta">
          {recipe.strCategory && <span className="tag">{recipe.strCategory}</span>}
          {recipe._tribe && recipe._tribe !== 'All' && <span className="tag tag-tribe">{recipe._tribe}</span>}
          {recipe._country && recipe._source === 'local' && <span className="tag tag-country">{recipe._country}</span>}
          {recipe.strArea && recipe._source !== 'local' && <span className="tag tag-secondary">{recipe.strArea}</span>}
        </div>
        {recipe._marketEstimate?.average && (
          <div className="card-budget">
            <Wallet size={11}/> ₦{recipe._marketEstimate.average.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

const SearchBar = ({ onSearch, placeholder = 'Search recipes…', defaultValue = '' }) => {
  const [q, setQ] = useState(defaultValue);
  useEffect(() => { setQ(defaultValue); }, [defaultValue]);
  return (
    <form className="search-bar" onSubmit={e => { e.preventDefault(); if (q.trim()) onSearch(q.trim()); }}>
      <div className="search-input-wrapper">
        <SearchIcon size={18} className="search-icon-prefix"/>
        <input type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder={placeholder} className="search-input"/>
      </div>
      <button type="submit" className="search-btn">Search</button>
    </form>
  );
};

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-mark"><UtensilsCrossed size={22}/></div>
          <span className="logo-text">PantryPal</span>
        </div>
        <ThemeToggle/>
      </div>
      <nav className="sidebar-nav">
        {ALL_NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} className={`nav-item ${active ? 'active' : ''}`}>
              <span className="nav-icon"><Icon size={18}/></span>
              <span className="nav-label">{label}</span>
              {active && <ChevronRight size={14} className="nav-chevron"/>}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <Heart size={12} className="footer-heart"/> <span>Made for food lovers</span>
      </div>
    </aside>
  );
};

const MobileDrawer = ({ open, onClose }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useRecipeStore();
  useEffect(() => { onClose(); }, [location.pathname]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  return (
    <>
      {open && <div className="drawer-backdrop" onClick={onClose}/>}
      <div className={`mobile-drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="logo-container">
            <div className="logo-mark logo-mark--sm"><UtensilsCrossed size={18}/></div>
            <span className="logo-text">PantryPal</span>
          </div>
          <button className="drawer-close" onClick={onClose}><X size={20}/></button>
        </div>
        <nav className="drawer-nav">
          {ALL_NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} className={`drawer-nav-item ${active ? 'active' : ''}`}>
                <span className="nav-icon"><Icon size={18}/></span>
                <span>{label}</span>
                {active && <ChevronRight size={14} className="nav-chevron"/>}
              </Link>
            );
          })}
        </nav>
        <div className="drawer-footer">
          <button className="drawer-theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16}/> : <Sun size={16}/>}
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
      </div>
    </>
  );
};

const MobileHeader = ({ onMenuOpen }) => (
  <header className="mobile-header">
    <button className="mobile-menu-btn" onClick={onMenuOpen} aria-label="Open menu"><Menu size={22}/></button>
    <div className="mobile-logo">
      <div className="logo-mark logo-mark--sm"><UtensilsCrossed size={16}/></div>
      <span className="logo-text">PantryPal</span>
    </div>
    <ThemeToggle/>
  </header>
);

const Footer = () => (
  <footer className="app-footer">
    <div className="footer-inner">
      <div className="footer-left">
        <div className="footer-logo">
          <div className="logo-mark logo-mark--sm"><UtensilsCrossed size={15}/></div>
          <span className="logo-text">PantryPal</span>
        </div>
        <p className="footer-copy">Designed &amp; built by <strong>Eniola Omoniyi</strong></p>
        <p className="footer-powered">Recipes powered by <a href="https://www.themealdb.com" target="_blank" rel="noopener noreferrer">TheMealDB</a> &amp; a curated African collection</p>
      </div>
      <div className="footer-socials">
        <a href="https://www.linkedin.com/in/eniola-tobi-omoniyi-948398381" target="_blank" rel="noopener noreferrer" className="social-link"><Linkedin size={18}/><span>LinkedIn</span></a>
        <a href="https://github.com/Ennyolatobi" target="_blank" rel="noopener noreferrer" className="social-link"><Github size={18}/><span>GitHub</span></a>
        <a href="mailto:eniolatobiomoniyi@gmail.com" className="social-link"><Mail size={18}/><span>Email</span></a>
      </div>
    </div>
  </footer>
);

// ─── PAGES ────────────────────────────────────────────────────────────────────

// HOME
const Home = () => {
  const [western, setWestern] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { recentlyViewed } = useRecipeStore();
  const trending  = getTrending().slice(0, 8);
  const breakfast = getBreakfast().slice(0, 4);

  useEffect(() => {
    getRandomMealDbRecipes(8).then(r => { setWestern(r); setLoading(false); });
  }, []);

  const features = [
    { icon: Flame,      label: '70+ African Recipes' },
    { icon: BookOpen,   label: '10,000+ Global Dishes' },
    { icon: Wallet,     label: 'Budget Meal Finder' },
    { icon: Refrigerator, label: 'Pantry Matcher' },
  ];

  const featureCards = [
    { icon: Flame,        title: 'African Kitchen',    desc: '70+ curated Nigerian and African recipes with regional context, tribe, and market pricing.' },
    { icon: Wallet,       title: 'Budget Meals',       desc: 'Enter a budget in Naira and see every meal you can cook today.' },
    { icon: Refrigerator, title: 'Pantry Matcher',     desc: 'Type what is in your kitchen and discover meals you can cook right now.' },
    { icon: Library,      title: 'Custom Cookbooks',   desc: 'Build and save personalised cookbook collections.' },
  ];

  return (
    <div className="page home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-eyebrow"><Flame size={14}/> African-First Recipe App</div>
          <h1 className="hero-title">Discover the Taste of Africa &amp; the World</h1>
          <p className="hero-subtitle">
            70+ curated Nigerian &amp; African recipes alongside 10,000+ global dishes. Plan meals, match your pantry, and cook within budget.
          </p>
          <SearchBar onSearch={q => navigate(`/search?q=${encodeURIComponent(q)}`)}/>
          <div className="hero-features">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="feature-badge"><Icon size={14}/><span>{label}</span></div>
            ))}
          </div>
        </div>
      </section>

      {trending.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title"><TrendingUp size={18} className="section-icon"/> Trending Nigerian Food</h2>
            <Link to="/explore" className="section-link">Explore all <ChevronRight size={14}/></Link>
          </div>
          <div className="recipe-grid">
            {trending.map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}
          </div>
        </section>
      )}

      {breakfast.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title"><Sun size={18} className="section-icon"/> African Breakfast</h2>
            <Link to="/explore?filter=breakfast" className="section-link">See all <ChevronRight size={14}/></Link>
          </div>
          <div className="recipe-grid">
            {breakfast.map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}
          </div>
        </section>
      )}

      <section className="home-section">
        <div className="section-header">
          <h2 className="section-title">Featured Global Recipes</h2>
          <Link to="/search" className="section-link">Browse all <ChevronRight size={14}/></Link>
        </div>
        {loading ? <LoadingSpinner/> : (
          <div className="recipe-grid">
            {western.map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}
          </div>
        )}
      </section>

      {recentlyViewed.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <h2 className="section-title"><Clock size={18} className="section-icon"/> Recently Viewed</h2>
          </div>
          <div className="recipe-grid">
            {recentlyViewed.slice(0, 4).map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}
          </div>
        </section>
      )}

      <section className="home-section features-detail-section">
        <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>What Makes PantryPal Different</h2>
        <div className="features-grid">
          {featureCards.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card">
              <div className="feature-card-icon"><Icon size={26}/></div>
              <h3>{title}</h3><p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// AFRICAN KITCHEN EXPLORE PAGE
const AfricanKitchen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const [activeFilter, setActiveFilter] = useState(params.get('filter') || 'all');
  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = [
    { id: 'all',        label: 'All African',  icon: Globe },
    { id: 'nigerian',   label: 'Nigerian',     icon: Flame },
    { id: 'yoruba',     label: 'Yoruba',       icon: MapPin },
    { id: 'igbo',       label: 'Igbo',         icon: MapPin },
    { id: 'hausa',      label: 'Hausa',        icon: MapPin },
    { id: 'breakfast',  label: 'Breakfast',    icon: Sun },
    { id: 'ghana',      label: 'Ghana',        icon: Globe },
    { id: 'ethiopia',   label: 'Ethiopia',     icon: Globe },
    { id: 'kenya',      label: 'Kenya',        icon: Globe },
    { id: 'southafrica',label: 'S. Africa',    icon: Globe },
    { id: 'senegal',    label: 'Senegal',      icon: Globe },
    { id: 'morocco',    label: 'Morocco',      icon: Globe },
  ];

  const applyFilter = async (filter, query = searchQ) => {
    setLoading(true);
    const res = await searchAllRecipes(query, filter);
    setResults(res);
    setLoading(false);
  };

  useEffect(() => { applyFilter(activeFilter); }, [activeFilter]);

  const handleFilterClick = (id) => {
    setActiveFilter(id);
    navigate(`/explore?filter=${id}`, { replace: true });
  };

  const tribal = [
    { tribe: 'Yoruba', color: '#7C3AED', recipes: getByTribe('Yoruba') },
    { tribe: 'Igbo',   color: '#059669', recipes: getByTribe('Igbo')   },
    { tribe: 'Hausa',  color: '#D97706', recipes: getByTribe('Hausa')  },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><Flame size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#E05A2B' }}/> African Kitchen</h1>
          <p className="subtitle">{results.length} recipes · curated collection</p>
        </div>
      </div>

      <div className="search-bar-container">
        <SearchBar onSearch={q => { setSearchQ(q); applyFilter(activeFilter, q); }} placeholder="Search African recipes…"/>
      </div>

      <div className="filter-chips">
        {filters.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`filter-chip ${activeFilter === id ? 'active' : ''}`} onClick={() => handleFilterClick(id)}>
            <Icon size={13}/> {label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner/> : results.length === 0 ? (
        <EmptyState icon={SearchIcon} title="No recipes found" body="Try a different filter or search term."/>
      ) : (
        <div className="recipe-grid">
          {results.map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}
        </div>
      )}

      {activeFilter === 'all' && !searchQ && (
        <section className="home-section" style={{ marginTop: '3rem' }}>
          <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Explore by Nigerian Tribe</h2>
          <div className="tribe-cards">
            {tribal.map(({ tribe, color, recipes }) => (
              <div key={tribe} className="tribe-card" style={{ '--tribe-color': color }}
                onClick={() => handleFilterClick(tribe.toLowerCase())}>
                <div className="tribe-card-preview">
                  {recipes.slice(0, 3).map(r => (
                    <img key={r.idMeal} src={r.strMealThumb} alt={r.strMeal}/>
                  ))}
                </div>
                <div className="tribe-card-info">
                  <h3>{tribe} Cuisine</h3>
                  <p>{recipes.length} dishes</p>
                  <ChevronRight size={16}/>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// SEARCH PAGE
const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(params.get('filter') || 'all');
  const [lastQ, setLastQ] = useState(params.get('q') || '');

  const filters = [
    { id: 'all',      label: 'All Cuisines' },
    { id: 'african',  label: 'African & Nigerian' },
    { id: 'nigerian', label: 'Nigerian Only' },
  ];

  const doSearch = async (q, filter = activeFilter) => {
    setLoading(true); setError(null); setLastQ(q);
    const res = await searchAllRecipes(q, filter);
    setRecipes(res);
    if (!res.length) setError('No recipes found. Try a different search term.');
    setLoading(false);
  };

  useEffect(() => {
    const q = params.get('q') || '';
    const f = params.get('filter') || 'all';
    setActiveFilter(f);
    if (q || f !== 'all') doSearch(q, f);
  }, [location.search]);

  return (
    <div className="page search-page">
      <div className="page-header">
        <div>
          <h1>Search Recipes</h1>
          {recipes.length > 0 && !loading && <p className="subtitle">{recipes.length} results</p>}
        </div>
      </div>
      <div className="search-bar-container">
        <SearchBar onSearch={q => { navigate(`/search?q=${encodeURIComponent(q)}&filter=${activeFilter}`, { replace: true }); doSearch(q); }} defaultValue={lastQ}/>
      </div>
      <div className="filter-chips">
        {filters.map(f => (
          <button key={f.id} className={`filter-chip ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => { setActiveFilter(f.id); doSearch(lastQ, f.id); }}>
            {f.label}
          </button>
        ))}
      </div>
      {loading && <LoadingSpinner/>}
      {!loading && error && <div className="inline-notice inline-notice--warning"><AlertCircle size={18}/><span>{error}</span></div>}
      {!loading && !error && recipes.length === 0 && !lastQ && (
        <EmptyState icon={SearchIcon} title="Search for a recipe" body="Type a dish name or use the filters above to browse African and Nigerian food."/>
      )}
      {!loading && recipes.length > 0 && <div className="recipe-grid">{recipes.map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}</div>}
    </div>
  );
};

// RECIPE DETAIL
const RecipeDetail = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);
  const [toast, setToast] = useState('');
  const { addFavorite, removeFavorite, isFavorite, addToShoppingList, addRecentlyViewed, recentlyViewed, favorites, myRecipes } = useRecipeStore();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      let data = await getRecipeById(id);
      if (!data) {
        data = recentlyViewed.find(r => r.idMeal === id)
            || favorites.find(r => r.idMeal === id)
            || myRecipes.find(r => r.idMeal === id)
            || null;
      }
      setRecipe(data);
      if (data) addRecentlyViewed(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  if (loading) return <LoadingSpinner/>;
  if (!recipe) return (
    <div className="page"><button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/><span>Back</span></button>
      <EmptyState icon={AlertCircle} title="Recipe not found" body="This recipe may have been removed or the link is invalid."/></div>
  );

  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const mea = recipe[`strMeasure${i}`];
    if (ing && ing.trim()) ingredients.push({ ingredient: ing, measure: mea || '' });
  }

  const fav = isFavorite(recipe.idMeal);
  const isLocal = recipe._source === 'local';
  const isSpoon = String(recipe.idMeal).startsWith('sp_');

  return (
    <div className="page recipe-detail-page">
      {toast && <div className="toast"><CheckCircle2 size={16}/><span>{toast}</span></div>}
      <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/><span>Back</span></button>

      <div className="recipe-detail">
        <div className={`recipe-detail-header ${isSpoon ? 'recipe-detail-header--sp' : ''}`}>
          <div className="recipe-detail-image-wrap">
            <img src={recipe.strMealThumb} alt={recipe.strMeal} className="recipe-detail-image"/>
            {isLocal && <span className="source-pill">African Recipe</span>}
          </div>
          <div className="recipe-detail-info">
            <h1>{recipe.strMeal}</h1>

            {isLocal && recipe._description && (
              <p className="recipe-description">{recipe._description}</p>
            )}

            <div className="recipe-meta">
              {recipe.strCategory && <span className="meta-badge"><Tag size={12}/> {recipe.strCategory}</span>}
              {recipe._country && <span className="meta-badge"><Globe size={12}/> {recipe._country}</span>}
              {recipe._tribe && recipe._tribe !== 'All' && <span className="meta-badge"><MapPin size={12}/> {recipe._tribe}</span>}
              {recipe._cookTime && <span className="meta-badge"><Clock size={12}/> {recipe._cookTime}</span>}
              {recipe._difficulty && <span className="meta-badge"><ChefHat size={12}/> {recipe._difficulty}</span>}
              {recipe._servings && <span className="meta-badge"><Users size={12}/> Serves {recipe._servings}</span>}
            </div>

            {isLocal && recipe._marketEstimate?.average && (
              <div className="market-estimate-box">
                <div className="market-estimate-title"><Wallet size={15}/> Estimated Market Cost</div>
                <div className="market-estimate-values">
                  <div><span>Budget</span><strong>₦{recipe._marketEstimate.lowBudget?.toLocaleString()}</strong></div>
                  <div className="market-avg"><span>Average</span><strong>₦{recipe._marketEstimate.average?.toLocaleString()}</strong></div>
                  <div><span>Premium</span><strong>₦{recipe._marketEstimate.high?.toLocaleString()}</strong></div>
                </div>
              </div>
            )}

            <div className="recipe-actions">
              <button className={`btn-action ${fav ? 'btn-action--active' : ''}`}
                onClick={() => fav ? removeFavorite(recipe.idMeal) : addFavorite(recipe)}>
                <Heart size={16} fill={fav ? 'currentColor' : 'none'}/> {fav ? 'Saved' : 'Save'}
              </button>
              <button className="btn-action" onClick={() => { addToShoppingList(ingredients); showToast('Ingredients added to shopping list'); }}>
                <ShoppingCart size={16}/> Add to List
              </button>
              <button className="btn-action" onClick={async () => {
                if (navigator.share) await navigator.share({ title: recipe.strMeal, url: window.location.href });
                else { navigator.clipboard.writeText(window.location.href); showToast('Link copied'); }
              }}>
                <Share2 size={16}/> Share
              </button>
            </div>

            <div className="servings-control">
              <label><Users size={14}/> Servings</label>
              <div className="servings-stepper">
                <button onClick={() => setServings(Math.max(1, servings - 1))}><Minus size={14}/></button>
                <span>{servings}</span>
                <button onClick={() => setServings(servings + 1)}><Plus size={14}/></button>
              </div>
            </div>

            {isLocal && recipe._tags?.length > 0 && (
              <div className="tags-row">
                {recipe._tags.map(t => <span key={t} className="tag tag-pill">{t}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="recipe-detail-content">
          <div className="ingredients-section">
            <h2><ClipboardList size={20}/> Ingredients</h2>
            {ingredients.length > 0 ? (
              <ul className="ingredients-list">
                {ingredients.map((item, i) => (
                  <li key={i}>
                    <span className="ingredient-measure">{item.measure}</span>
                    <span className="ingredient-name">{item.ingredient}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="no-data-note">Ingredient details not available.</p>}
          </div>

          <div className="instructions-section">
            <h2><ListChecks size={20}/> Instructions</h2>
            <div className="instructions-text">
              {recipe.strInstructions
                ? recipe.strInstructions.split('\n').filter(s => s.trim()).map((step, i) => <p key={i}>{step}</p>)
                : <p className="no-data-note">See source website for full instructions.</p>}
            </div>
            {recipe.strYoutube && (
              <div className="video-section">
                <h3>Video Tutorial</h3>
                <a href={recipe.strYoutube} target="_blank" rel="noopener noreferrer" className="video-link">
                  <Play size={16}/> Watch on YouTube
                </a>
              </div>
            )}
            {recipe._source === 'local' && recipe._nutrition?.calories && (
              <div className="nutrition-box">
                <h3><Leaf size={16}/> Nutrition (per serving)</h3>
                <div className="nutrition-grid">
                  {Object.entries(recipe._nutrition).map(([k, v]) => (
                    <div key={k} className="nutrition-item">
                      <span className="nut-val">{v}</span>
                      <span className="nut-key">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// FAVORITES
const Favorites = () => {
  const { favorites } = useRecipeStore();
  return (
    <div className="page favorites-page">
      <div className="page-header"><div><h1>My Favorites</h1><p className="subtitle">{favorites.length} saved recipes</p></div></div>
      {favorites.length === 0
        ? <EmptyState icon={Heart} title="No favorites yet" body="Start exploring and save your favourite recipes." action={<Link to="/search" className="btn-primary"><SearchIcon size={16}/>Browse Recipes</Link>}/>
        : <div className="recipe-grid">{favorites.map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}</div>}
    </div>
  );
};

// MY RECIPES
const MyRecipes = () => {
  const { myRecipes, addMyRecipe, removeMyRecipe } = useRecipeStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ strMeal: '', strCategory: '', strArea: '', strInstructions: '', strMealThumb: 'https://via.placeholder.com/400' });
  return (
    <div className="page my-recipes-page">
      <div className="page-header">
        <div><h1>My Recipes</h1><p className="subtitle">{myRecipes.length} custom recipes</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16}/>Add Recipe</button>
      </div>
      {showForm && (
        <div className="recipe-form-card">
          <h3><Pencil size={16}/> Create New Recipe</h3>
          <form onSubmit={e => { e.preventDefault(); addMyRecipe({ ...form, _source: 'my' }); setShowForm(false); setForm({ strMeal: '', strCategory: '', strArea: '', strInstructions: '', strMealThumb: 'https://via.placeholder.com/400' }); }}>
            <div className="form-grid">
              <input placeholder="Recipe name" required value={form.strMeal} onChange={e => setForm({ ...form, strMeal: e.target.value })}/>
              <input placeholder="Category" value={form.strCategory} onChange={e => setForm({ ...form, strCategory: e.target.value })}/>
              <input placeholder="Cuisine / Country" value={form.strArea} onChange={e => setForm({ ...form, strArea: e.target.value })}/>
            </div>
            <textarea rows={6} placeholder="Instructions…" required value={form.strInstructions} onChange={e => setForm({ ...form, strInstructions: e.target.value })}/>
            <div className="form-actions">
              <button type="submit" className="btn-primary"><Save size={16}/>Save</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}><X size={16}/>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {myRecipes.length === 0 && !showForm
        ? <EmptyState icon={BookOpen} title="No custom recipes yet" body="Add your own recipes to build your personal collection."/>
        : <div className="recipe-grid">{myRecipes.map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}</div>}
    </div>
  );
};

// MEAL PLANNER
const MealPlanner = () => {
  const { mealPlan, addMealToPlan, removeMealFromPlan, favorites } = useRecipeStore();
  const [selector, setSelector] = useState(null);
  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const week  = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0]; });
  return (
    <div className="page meal-planner-page">
      <div className="page-header"><div><h1>Meal Planner</h1><p className="subtitle">Plan your week ahead</p></div></div>
      <div className="meal-planner-grid">
        {week.map(date => (
          <div key={date} className="day-column">
            <div className="day-header">
              <h3>{new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short' })}</h3>
              <span>{new Date(date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            {meals.map(meal => (
              <div key={meal} className="meal-slot">
                <div className="meal-slot-label"><Utensils size={11}/>{meal}</div>
                {mealPlan[date]?.[meal] ? (
                  <div className="planned-meal">
                    <img src={mealPlan[date][meal].strMealThumb} alt={mealPlan[date][meal].strMeal}/>
                    <p>{mealPlan[date][meal].strMeal}</p>
                    <button onClick={() => removeMealFromPlan(date, meal)} className="remove-meal-btn"><X size={12}/></button>
                  </div>
                ) : (
                  <button className="add-meal-btn" onClick={() => setSelector({ date, meal })}><Plus size={14}/><span>Add</span></button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {selector && (
        <div className="modal-overlay" onClick={() => setSelector(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select a Recipe</h2>
              <button className="modal-close" onClick={() => setSelector(null)}><X size={20}/></button>
            </div>
            {favorites.length === 0
              ? <div className="inline-notice inline-notice--info"><Info size={18}/><span>Save some recipes first.</span></div>
              : <div className="recipe-selector-grid">
                  {favorites.map(r => (
                    <div key={r.idMeal} className="recipe-selector-item" onClick={() => { addMealToPlan(selector.date, selector.meal, r); setSelector(null); }}>
                      <img src={r.strMealThumb} alt={r.strMeal}/><p>{r.strMeal}</p>
                    </div>
                  ))}
                </div>}
          </div>
        </div>
      )}
    </div>
  );
};

// SHOPPING LIST
const ShoppingList = () => {
  const { shoppingList, toggleShoppingItem, removeShoppingItem, clearCheckedItems, addToShoppingList } = useRecipeStore();
  const [newItem, setNewItem] = useState('');
  const grouped = shoppingList.reduce((acc, item) => { (acc[item.category] = acc[item.category] || []).push(item); return acc; }, {});
  const checked = shoppingList.filter(i => i.checked).length;
  const addManual = e => { e.preventDefault(); if (!newItem.trim()) return; addToShoppingList([{ ingredient: newItem.trim(), measure: '' }]); setNewItem(''); };
  return (
    <div className="page shopping-list-page">
      <div className="page-header">
        <div><h1>Shopping List</h1>{shoppingList.length > 0 && <p className="subtitle">{shoppingList.length} items{checked > 0 ? ` · ${checked} checked` : ''}</p>}</div>
        {shoppingList.length > 0 && (
          <div className="header-actions">
            {checked > 0 && <button onClick={clearCheckedItems} className="btn-secondary">Clear checked</button>}
            <button onClick={() => window.print()} className="btn-primary"><Printer size={16}/>Print</button>
          </div>
        )}
      </div>
      <form className="add-item-form" onSubmit={addManual}>
        <input className="add-item-input" placeholder="Add an item manually…" value={newItem} onChange={e => setNewItem(e.target.value)}/>
        <button type="submit" className="btn-primary" disabled={!newItem.trim()}><Plus size={16}/>Add</button>
      </form>
      {shoppingList.length === 0
        ? <EmptyState icon={ShoppingCart} title="Shopping list is empty" body="Add ingredients from recipes, or type items above."/>
        : <div className="shopping-list-content">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="shopping-category">
                <h3 className="category-heading">{cat}</h3>
                <ul>{items.map(item => (
                  <li key={item.id} className={`shopping-item ${item.checked ? 'checked' : ''}`}>
                    <input type="checkbox" checked={item.checked} onChange={() => toggleShoppingItem(item.id)}/>
                    <span className="item-name">{item.amount} {item.name}</span>
                    <button onClick={() => removeShoppingItem(item.id)} className="remove-item-btn"><X size={14}/></button>
                  </li>
                ))}</ul>
              </div>
            ))}
          </div>}
    </div>
  );
};

// COOKBOOK
const Cookbook = () => {
  const { cookbooks, favorites, createCookbook, deleteCookbook } = useRecipeStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  return (
    <div className="page cookbook-page">
      <div className="page-header">
        <div><h1>My Cookbooks</h1><p className="subtitle">{cookbooks.length} collections</p></div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16}/>New Cookbook</button>
      </div>
      {showForm && (
        <div className="recipe-form-card">
          <h3><BookMarked size={16}/> Create Cookbook</h3>
          <input placeholder="Cookbook title" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', marginBottom: '1rem' }}/>
          {favorites.length === 0
            ? <div className="inline-notice inline-notice--info"><Info size={16}/><span>Save some favorites first.</span></div>
            : <div className="recipe-selection-grid">
                {favorites.map(r => (
                  <label key={r.idMeal} className={`recipe-checkbox ${selected.includes(r.idMeal) ? 'selected' : ''}`}>
                    <input type="checkbox" checked={selected.includes(r.idMeal)} onChange={e => setSelected(e.target.checked ? [...selected, r.idMeal] : selected.filter(id => id !== r.idMeal))}/>
                    <img src={r.strMealThumb} alt={r.strMeal}/><span>{r.strMeal}</span>
                  </label>
                ))}
              </div>}
          <div className="form-actions">
            <button onClick={() => { if (name && selected.length) { createCookbook(name, favorites.filter(r => selected.includes(r.idMeal))); setShowForm(false); setName(''); setSelected([]); } }} className="btn-primary" disabled={!name || !selected.length}><Save size={16}/>Create</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary"><X size={16}/>Cancel</button>
          </div>
        </div>
      )}
      {cookbooks.length === 0 && !showForm
        ? <EmptyState icon={Library} title="No cookbooks yet" body="Create your first collection from your saved recipes."/>
        : <div className="cookbook-grid">
            {cookbooks.map(cb => (
              <div key={cb.id} className="cookbook-card">
                <div className="cookbook-preview">
                  {cb.recipes.slice(0, 4).map(r => <img key={r.idMeal} src={r.strMealThumb} alt={r.strMeal}/>)}
                  {cb.recipes.length < 4 && Array(4 - cb.recipes.length).fill(0).map((_, i) => <div key={i} className="cookbook-preview-placeholder"/>)}
                </div>
                <div className="cookbook-card-info"><h3>{cb.name}</h3><p>{cb.recipes.length} recipes</p></div>
                <button onClick={() => deleteCookbook(cb.id)} className="btn-danger-sm"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>}
    </div>
  );
};

// BUDGET MEALS PAGE
const BudgetMeals = () => {
  const [budget, setBudget] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const presets = [1500, 2500, 3000, 5000, 7500, 10000];

  const search = (b) => {
    const n = parseInt(b, 10);
    if (!n || n < 100) return;
    setResults(filterByMaxBudget(n));
    setSearched(true);
  };

  return (
    <div className="page budget-page">
      <div className="page-header">
        <div>
          <h1><Wallet size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#059669' }}/> Budget Meal Finder</h1>
          <p className="subtitle">Find meals you can cook within your budget</p>
        </div>
      </div>

      <div className="budget-input-card">
        <h3>What's your cooking budget today?</h3>
        <div className="budget-input-row">
          <div className="budget-input-wrap">
            <span className="budget-currency">₦</span>
            <input type="number" className="budget-input" placeholder="e.g. 3000" value={budget}
              onChange={e => setBudget(e.target.value)} onKeyDown={e => e.key === 'Enter' && search(budget)}/>
          </div>
          <button className="btn-primary" onClick={() => search(budget)} disabled={!budget}><Filter size={16}/>Find Meals</button>
        </div>
        <div className="budget-presets">
          {presets.map(p => (
            <button key={p} className={`preset-chip ${budget == p ? 'active' : ''}`} onClick={() => { setBudget(String(p)); search(p); }}>
              Cook with ₦{p.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {searched && results.length === 0 && (
        <EmptyState icon={Wallet} title="No meals found" body={`No recipes found under ₦${parseInt(budget).toLocaleString()}. Try increasing your budget.`}/>
      )}

      {results.length > 0 && (
        <>
          <div className="budget-results-header">
            <p><strong>{results.length} meals</strong> you can cook for under <strong>₦{parseInt(budget).toLocaleString()}</strong> — sorted cheapest first</p>
          </div>
          <div className="recipe-grid">
            {results.map(r => <RecipeCard key={r.idMeal} recipe={r}/>)}
          </div>
        </>
      )}

      {!searched && (
        <div className="budget-examples">
          <h3>Popular Budget Sections</h3>
          <div className="budget-example-grid">
            {[
              { label: 'Under ₦1,500', val: 1500, icon: '🟢', desc: 'Most affordable everyday meals' },
              { label: 'Under ₦3,000', val: 3000, icon: '🟡', desc: 'Good variety on a moderate budget' },
              { label: 'Under ₦5,000', val: 5000, icon: '🟠', desc: 'Full range including soups and stews' },
            ].map(({ label, val, icon, desc }) => (
              <div key={val} className="budget-example-card" onClick={() => { setBudget(String(val)); search(val); }}>
                <div className="bex-icon">{icon}</div>
                <div><h4>{label}</h4><p>{desc}</p></div>
                <ChevronRight size={16}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// PANTRY MATCH PAGE
const PantryMatchPage = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const doMatch = () => {
    const ingredients = input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (!ingredients.length) return;
    setResults(pantryMatch(ingredients));
    setSearched(true);
  };

  return (
    <div className="page pantry-page">
      <div className="page-header">
        <div>
          <h1><Refrigerator size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#7C3AED' }}/> Pantry Matcher</h1>
          <p className="subtitle">Cook with what you already have</p>
        </div>
      </div>

      <div className="pantry-input-card">
        <h3>What ingredients do you have right now?</h3>
        <p className="form-label">Enter one ingredient per line, or separate with commas</p>
        <textarea className="pantry-textarea" rows={6}
          placeholder={"rice\ntomatoes\nonion\npalm oil\ncrayfish\neppers"}
          value={input} onChange={e => setInput(e.target.value)}/>
        <button className="btn-primary" onClick={doMatch} disabled={!input.trim()}>
          <ChefHat size={16}/> Find Matching Recipes
        </button>
        <div className="pantry-examples">
          <p className="form-label">Try an example:</p>
          {[
            'yam, eggs, tomatoes, onion, oil',
            'rice, tomatoes, pepper, onion, chicken',
            'beans, palm oil, crayfish, onion',
          ].map(ex => (
            <button key={ex} className="example-chip" onClick={() => { setInput(ex); }}>{ex}</button>
          ))}
        </div>
      </div>

      {searched && results.length === 0 && (
        <EmptyState icon={Refrigerator} title="No matches found"
          body="Try adding more ingredients. You need at least 30% of a recipe's ingredients to see it here."/>
      )}

      {results.length > 0 && (
        <>
          <div className="pantry-results-header">
            <p>Found <strong>{results.length} recipes</strong> you can mostly cook right now</p>
          </div>
          <div className="pantry-results-grid">
            {results.map(({ recipe, percent, matchedCount, totalCount }) => (
              <div key={recipe.idMeal} className="pantry-result-card" onClick={() => window.location.href = `/recipe/${recipe.idMeal}`}>
                <img src={recipe.strMealThumb} alt={recipe.strMeal}/>
                <div className="pantry-result-info">
                  <h3>{recipe.strMeal}</h3>
                  <div className="match-bar-wrap">
                    <div className="match-bar" style={{ '--pct': `${percent}%` }}/>
                  </div>
                  <div className="match-meta">
                    <span className={`match-pct ${percent >= 70 ? 'high' : percent >= 50 ? 'mid' : ''}`}>{percent}% match</span>
                    <span className="match-detail">{matchedCount}/{totalCount} ingredients</span>
                  </div>
                  {recipe._marketEstimate?.average && (
                    <span className="pantry-budget"><Wallet size={11}/> ₦{recipe._marketEstimate.average.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
const App = () => {
  const { theme } = useRecipeStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  return (
    <Router>
      <div className="app-container">
        <Sidebar/>
        <MobileHeader onMenuOpen={() => setDrawerOpen(true)}/>
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
        <main className="main-content">
          <Routes>
            <Route path="/"              element={<Home/>}/>
            <Route path="/explore"       element={<AfricanKitchen/>}/>
            <Route path="/search"        element={<Search/>}/>
            <Route path="/recipe/:id"    element={<RecipeDetail/>}/>
            <Route path="/favorites"     element={<Favorites/>}/>
            <Route path="/my-recipes"    element={<MyRecipes/>}/>
            <Route path="/meal-planner"  element={<MealPlanner/>}/>
            <Route path="/shopping-list" element={<ShoppingList/>}/>
            <Route path="/cookbook"      element={<Cookbook/>}/>
            <Route path="/budget"        element={<BudgetMeals/>}/>
            <Route path="/pantry"        element={<PantryMatchPage/>}/>
          </Routes>
          <Footer/>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        :root{
          --font-display:'Sora',sans-serif;--font-body:'DM Sans',sans-serif;
          --accent:#E05A2B;--accent-light:#F2784B;--accent-muted:#FDF0EB;
          --green:#2C7A4B;--green-muted:#EBF7F1;
          --purple:#7C3AED;--purple-muted:#F5F3FF;
          --gold:#D97706;--gold-muted:#FFFBEB;
          --bg-canvas:#FAFAF8;--bg-surface:#FFFFFF;--bg-raised:#F4F4F0;--bg-border:#E8E8E4;
          --text-primary:#1A1A18;--text-secondary:#6B6B65;--text-muted:#9D9D96;
          --shadow-xs:0 1px 2px rgba(0,0,0,.06);--shadow-sm:0 2px 6px rgba(0,0,0,.08);
          --shadow-md:0 4px 16px rgba(0,0,0,.10);--shadow-lg:0 12px 32px rgba(0,0,0,.12);
          --sidebar-width:256px;--radius-sm:6px;--radius-md:10px;--radius-lg:16px;--radius-xl:24px;
          --transition:.2s ease;
        }
        [data-theme="dark"]{
          --bg-canvas:#111110;--bg-surface:#1C1C1A;--bg-raised:#252522;--bg-border:#333330;
          --text-primary:#F0F0EC;--text-secondary:#9D9D96;--text-muted:#6B6B65;
          --accent-muted:#2A1810;--green-muted:#0F2318;--purple-muted:#1E1832;--gold-muted:#1C1508;
        }
        body{font-family:var(--font-body);background:var(--bg-canvas);color:var(--text-primary);line-height:1.6;font-size:15px}
        a{color:inherit;text-decoration:none}

        /* ── Layout ── */
        .app-container{display:flex;min-height:100vh}
        .sidebar{width:var(--sidebar-width);background:var(--bg-surface);border-right:1px solid var(--bg-border);display:flex;flex-direction:column;position:fixed;height:100vh;overflow-y:auto;z-index:100}
        .sidebar-header{padding:1.5rem 1.25rem 1.25rem;border-bottom:1px solid var(--bg-border);display:flex;align-items:center;justify-content:space-between}
        .logo-container{display:flex;align-items:center;gap:.625rem}
        .logo-mark{width:36px;height:36px;background:var(--accent);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0}
        .logo-mark--sm{width:28px;height:28px;background:var(--accent);border-radius:5px;display:flex;align-items:center;justify-content:center;color:white}
        .logo-text{font-family:var(--font-display);font-size:1.125rem;font-weight:700;color:var(--text-primary);letter-spacing:-.02em}
        .theme-toggle{width:34px;height:34px;background:var(--bg-raised);border:1px solid var(--bg-border);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);transition:var(--transition)}
        .theme-toggle:hover{background:var(--bg-border);color:var(--text-primary)}
        .sidebar-nav{flex:1;padding:1rem .75rem;display:flex;flex-direction:column;gap:2px}
        .nav-item{display:flex;align-items:center;gap:.75rem;padding:.6rem .875rem;color:var(--text-secondary);text-decoration:none;border-radius:var(--radius-sm);transition:var(--transition);font-size:.875rem;font-weight:500;position:relative}
        .nav-item:hover{background:var(--bg-raised);color:var(--text-primary)}
        .nav-item.active{background:var(--accent-muted);color:var(--accent);font-weight:600}
        .nav-icon{display:flex;align-items:center;flex-shrink:0}
        .nav-label{flex:1}
        .nav-chevron{margin-left:auto;opacity:.6}
        .sidebar-footer{padding:1rem 1.25rem;border-top:1px solid var(--bg-border);display:flex;align-items:center;gap:.375rem;color:var(--text-muted);font-size:.75rem}
        .footer-heart{color:var(--accent);flex-shrink:0}

        /* ── Mobile header ── */
        .mobile-header{display:none;position:fixed;top:0;left:0;right:0;height:56px;background:var(--bg-surface);border-bottom:1px solid var(--bg-border);padding:0 1rem;align-items:center;justify-content:space-between;z-index:200;box-shadow:var(--shadow-xs)}
        .mobile-menu-btn{width:38px;height:38px;background:var(--bg-raised);border:1px solid var(--bg-border);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-primary);transition:var(--transition)}
        .mobile-logo{display:flex;align-items:center;gap:.5rem;position:absolute;left:50%;transform:translateX(-50%)}

        /* ── Mobile drawer ── */
        .drawer-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);z-index:300;animation:fadeIn .2s ease}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .mobile-drawer{position:fixed;top:0;left:0;bottom:0;width:280px;background:var(--bg-surface);border-right:1px solid var(--bg-border);display:flex;flex-direction:column;z-index:400;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);box-shadow:var(--shadow-lg)}
        .mobile-drawer.open{transform:translateX(0)}
        .drawer-header{padding:1rem 1.25rem;border-bottom:1px solid var(--bg-border);display:flex;align-items:center;justify-content:space-between;min-height:56px}
        .drawer-close{width:34px;height:34px;background:var(--bg-raised);border:1px solid var(--bg-border);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-secondary);transition:var(--transition)}
        .drawer-nav{flex:1;overflow-y:auto;padding:.75rem;display:flex;flex-direction:column;gap:2px}
        .drawer-nav-item{display:flex;align-items:center;gap:.875rem;padding:.7rem 1rem;color:var(--text-secondary);text-decoration:none;border-radius:var(--radius-sm);font-size:.925rem;font-weight:500;transition:var(--transition)}
        .drawer-nav-item:hover{background:var(--bg-raised);color:var(--text-primary)}
        .drawer-nav-item.active{background:var(--accent-muted);color:var(--accent);font-weight:600}
        .drawer-footer{padding:1rem 1.25rem;border-top:1px solid var(--bg-border)}
        .drawer-theme-btn{display:flex;align-items:center;gap:.625rem;width:100%;padding:.625rem .875rem;background:var(--bg-raised);border:1px solid var(--bg-border);border-radius:var(--radius-sm);color:var(--text-secondary);font-size:.875rem;font-weight:500;cursor:pointer;transition:var(--transition);font-family:var(--font-body)}
        .drawer-theme-btn:hover{background:var(--bg-border);color:var(--text-primary)}

        /* ── Main content ── */
        .main-content{flex:1;margin-left:var(--sidebar-width);padding:2rem 2.5rem;max-width:calc(100vw - var(--sidebar-width))}
        .page{max-width:1320px;margin:0 auto}
        .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;padding-bottom:1.25rem;border-bottom:1px solid var(--bg-border)}
        .page-header h1{font-family:var(--font-display);font-size:1.75rem;font-weight:700;letter-spacing:-.03em}
        .subtitle{color:var(--text-secondary);font-size:.875rem;margin-top:.25rem}
        .header-actions{display:flex;gap:.75rem;align-items:center}

        /* ── Buttons ── */
        .btn-primary{display:inline-flex;align-items:center;gap:.5rem;padding:.625rem 1.25rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);font-size:.875rem;font-weight:600;cursor:pointer;transition:var(--transition);text-decoration:none;font-family:var(--font-body)}
        .btn-primary:hover{background:var(--accent-light);transform:translateY(-1px)}
        .btn-primary:disabled{opacity:.5;pointer-events:none}
        .btn-secondary{display:inline-flex;align-items:center;gap:.5rem;padding:.625rem 1.25rem;background:var(--bg-raised);color:var(--text-primary);border:1px solid var(--bg-border);border-radius:var(--radius-sm);font-size:.875rem;font-weight:500;cursor:pointer;transition:var(--transition);font-family:var(--font-body)}
        .btn-secondary:hover{background:var(--bg-border)}
        .btn-action{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1rem;border:1.5px solid var(--bg-border);background:transparent;color:var(--text-secondary);border-radius:var(--radius-sm);font-size:.85rem;font-weight:500;cursor:pointer;transition:var(--transition);font-family:var(--font-body)}
        .btn-action:hover{border-color:var(--accent);color:var(--accent)}
        .btn-action--active{background:var(--accent);border-color:var(--accent);color:white}
        .btn-action--active:hover{background:var(--accent-light)}
        .btn-danger-sm{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:transparent;border:1px solid var(--bg-border);color:var(--text-muted);border-radius:var(--radius-sm);cursor:pointer;transition:var(--transition);flex-shrink:0}
        .btn-danger-sm:hover{background:#FEE2E2;border-color:#FCA5A5;color:#DC2626}

        /* ── Hero ── */
        .hero-section{background:linear-gradient(140deg,#1A1A18 0%,#2D2D28 60%,#3A2010 100%);border-radius:var(--radius-xl);padding:4rem 3rem;color:white;margin-bottom:3rem;position:relative;overflow:hidden}
        .hero-section::before{content:'';position:absolute;top:-60px;right:-60px;width:280px;height:280px;background:var(--accent);border-radius:50%;opacity:.12}
        .hero-section::after{content:'';position:absolute;bottom:-80px;left:30%;width:220px;height:220px;background:var(--accent-light);border-radius:50%;opacity:.08}
        .hero-content{max-width:680px;position:relative;z-index:1}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:.375rem;background:rgba(224,90,43,.25);border:1px solid rgba(224,90,43,.4);color:#F2784B;padding:.3rem .875rem;border-radius:100px;font-size:.78rem;font-weight:600;margin-bottom:1rem;letter-spacing:.03em}
        .hero-title{font-family:var(--font-display);font-size:2.75rem;font-weight:800;letter-spacing:-.04em;line-height:1.1;margin-bottom:1rem}
        .hero-subtitle{font-size:1.05rem;opacity:.8;margin-bottom:2rem;line-height:1.65}
        .hero-features{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.75rem}
        .feature-badge{display:inline-flex;align-items:center;gap:.375rem;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);padding:.35rem .875rem;border-radius:100px;font-size:.78rem;font-weight:500}

        /* ── Search bar ── */
        .search-bar{display:flex;gap:.75rem;max-width:580px}
        .search-input-wrapper{flex:1;position:relative;display:flex;align-items:center}
        .search-icon-prefix{position:absolute;left:1rem;color:rgba(255,255,255,.5);pointer-events:none}
        .search-input{width:100%;padding:.875rem 1rem .875rem 2.75rem;border:1.5px solid rgba(255,255,255,.2);border-radius:var(--radius-sm);background:rgba(255,255,255,.12);color:white;font-size:.95rem;font-family:var(--font-body);transition:var(--transition)}
        .search-input::placeholder{color:rgba(255,255,255,.4)}
        .search-input:focus{outline:none;border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.18)}
        .search-bar-container .search-input{background:var(--bg-surface);color:var(--text-primary);border-color:var(--bg-border)}
        .search-bar-container .search-input::placeholder{color:var(--text-muted)}
        .search-bar-container .search-icon-prefix{color:var(--text-muted)}
        .search-btn{padding:.875rem 1.5rem;background:white;color:var(--accent);border:none;border-radius:var(--radius-sm);font-size:.9rem;font-weight:700;cursor:pointer;transition:var(--transition);font-family:var(--font-body);white-space:nowrap}
        .search-btn:hover{transform:translateY(-1px);box-shadow:var(--shadow-sm)}
        .search-bar-container .search-btn{background:var(--accent);color:white}
        .search-bar-container{margin-bottom:1.25rem}

        /* ── Filter chips ── */
        .filter-chips{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:1.75rem}
        .filter-chip{display:inline-flex;align-items:center;gap:.375rem;padding:.45rem .9rem;border:1.5px solid var(--bg-border);background:var(--bg-surface);color:var(--text-secondary);border-radius:100px;font-size:.8rem;font-weight:500;cursor:pointer;transition:var(--transition);font-family:var(--font-body);white-space:nowrap}
        .filter-chip:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-muted)}
        .filter-chip.active{background:var(--accent);border-color:var(--accent);color:white;font-weight:600}

        /* ── Section headings ── */
        .home-section{margin-bottom:3.5rem}
        .section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}
        .section-title{display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1.35rem;font-weight:700;letter-spacing:-.02em}
        .section-icon{color:var(--text-secondary);flex-shrink:0}
        .section-link{display:inline-flex;align-items:center;gap:.25rem;color:var(--accent);text-decoration:none;font-size:.85rem;font-weight:600;transition:var(--transition)}
        .section-link:hover{opacity:.8}

        /* ── Recipe grid ── */
        .recipe-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem}
        .recipe-card{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-md);overflow:hidden;cursor:pointer;transition:var(--transition)}
        .recipe-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-md);border-color:transparent}
        .recipe-card-image{position:relative;width:100%;aspect-ratio:1;overflow:hidden}
        .recipe-card-image img{width:100%;height:100%;object-fit:cover;transition:transform .3s ease}
        .recipe-card:hover .recipe-card-image img{transform:scale(1.04)}
        .favorite-btn{position:absolute;top:.75rem;right:.75rem;background:var(--bg-surface);border:1px solid var(--bg-border);width:34px;height:34px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--transition);color:var(--text-muted)}
        .favorite-btn:hover{color:var(--accent);border-color:var(--accent)}
        .favorite-btn.active{color:var(--accent);background:var(--accent-muted);border-color:var(--accent)}
        .card-local-badge{position:absolute;top:.75rem;left:.75rem;background:var(--accent);color:white;font-size:.65rem;font-weight:700;padding:.2rem .55rem;border-radius:100px;letter-spacing:.04em}
        .recipe-card-content{padding:1rem 1.125rem 1.125rem}
        .recipe-card-content h3{font-family:var(--font-display);font-size:.95rem;font-weight:600;letter-spacing:-.01em;line-height:1.4;margin-bottom:.625rem}
        .recipe-card-meta{display:flex;gap:.375rem;flex-wrap:wrap;margin-bottom:.5rem}
        .tag{background:var(--bg-raised);padding:.2rem .6rem;border-radius:100px;font-size:.72rem;font-weight:500;color:var(--text-secondary)}
        .tag-secondary{background:var(--green-muted);color:var(--green)}
        .tag-tribe{background:var(--purple-muted);color:var(--purple)}
        .tag-country{background:var(--gold-muted);color:var(--gold)}
        .tag-pill{background:var(--accent-muted);color:var(--accent)}
        .card-budget{display:flex;align-items:center;gap:.3rem;font-size:.72rem;font-weight:600;color:var(--green);margin-top:.375rem}

        /* ── Features grid ── */
        .features-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
        .feature-card{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-md);padding:1.5rem;transition:var(--transition)}
        .feature-card:hover{box-shadow:var(--shadow-sm);transform:translateY(-2px)}
        .feature-card-icon{width:48px;height:48px;background:var(--accent-muted);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:var(--accent);margin-bottom:1rem}
        .feature-card h3{font-family:var(--font-display);font-size:.95rem;font-weight:700;margin-bottom:.375rem;letter-spacing:-.01em}
        .feature-card p{font-size:.85rem;color:var(--text-secondary);line-height:1.55}

        /* ── Tribe cards ── */
        .tribe-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
        .tribe-card{background:var(--bg-surface);border:2px solid var(--bg-border);border-radius:var(--radius-md);overflow:hidden;cursor:pointer;transition:var(--transition)}
        .tribe-card:hover{border-color:var(--tribe-color,var(--accent));transform:translateY(-3px);box-shadow:var(--shadow-md)}
        .tribe-card-preview{display:grid;grid-template-columns:repeat(3,1fr);height:120px}
        .tribe-card-preview img{width:100%;height:100%;object-fit:cover}
        .tribe-card-info{display:flex;align-items:center;padding:.875rem 1rem;gap:.5rem}
        .tribe-card-info h3{font-family:var(--font-display);font-size:.95rem;font-weight:700;flex:1}
        .tribe-card-info p{font-size:.78rem;color:var(--text-secondary);white-space:nowrap}

        /* ── Loading / Empty ── */
        .loading-spinner{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;min-height:300px;color:var(--text-secondary)}
        .spin-icon{animation:spin 1.2s linear infinite;color:var(--accent)}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;padding:5rem 2rem;text-align:center}
        .empty-icon{color:var(--text-muted);margin-bottom:.5rem}
        .empty-state h2{font-family:var(--font-display);font-size:1.25rem;font-weight:700}
        .empty-state p{color:var(--text-secondary);font-size:.9rem;max-width:320px}

        /* ── Notices ── */
        .inline-notice{display:flex;align-items:center;gap:.75rem;padding:.875rem 1.25rem;border-radius:var(--radius-md);font-size:.875rem;margin-bottom:1.5rem}
        .inline-notice--warning{background:#FEF3C7;color:#92400E;border:1px solid #FDE68A}
        .inline-notice--info{background:var(--bg-raised);color:var(--text-secondary);border:1px solid var(--bg-border)}

        /* ── Recipe detail ── */
        .back-btn{display:inline-flex;align-items:center;gap:.5rem;margin-bottom:1.5rem;background:var(--bg-surface);border:1px solid var(--bg-border);color:var(--text-secondary);padding:.5rem 1rem;border-radius:var(--radius-sm);font-size:.85rem;font-weight:500;cursor:pointer;transition:var(--transition);font-family:var(--font-body)}
        .back-btn:hover{background:var(--bg-raised);color:var(--text-primary)}
        .recipe-detail{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-lg);overflow:hidden}
        .recipe-detail-header{display:grid;grid-template-columns:420px 1fr}
        .recipe-detail-header--sp{display:flex;flex-direction:column}
        .recipe-detail-image-wrap{position:relative;overflow:hidden;background:var(--bg-raised)}
        .recipe-detail-header:not(.recipe-detail-header--sp) .recipe-detail-image-wrap{height:100%}
        .recipe-detail-header--sp .recipe-detail-image-wrap{width:100%;max-height:340px}
        .recipe-detail-image{width:100%;height:100%;object-fit:cover;display:block}
        .recipe-detail-header:not(.recipe-detail-header--sp) .recipe-detail-image{min-height:420px;max-height:520px}
        .recipe-detail-header--sp .recipe-detail-image{height:340px;object-position:center 30%}
        .source-pill{position:absolute;bottom:.75rem;left:.75rem;background:var(--accent);color:white;font-size:.7rem;font-weight:600;padding:.25rem .625rem;border-radius:100px;letter-spacing:.04em}
        .recipe-detail-info{padding:2.5rem;display:flex;flex-direction:column;gap:1.25rem}
        .recipe-detail-info h1{font-family:var(--font-display);font-size:2rem;font-weight:800;letter-spacing:-.04em;line-height:1.2}
        .recipe-description{font-size:.9rem;color:var(--text-secondary);line-height:1.65;font-style:italic;border-left:3px solid var(--accent);padding-left:.875rem}
        .recipe-meta{display:flex;gap:.5rem;flex-wrap:wrap}
        .meta-badge{display:inline-flex;align-items:center;gap:.375rem;background:var(--bg-raised);border:1px solid var(--bg-border);padding:.3rem .75rem;border-radius:100px;font-size:.78rem;font-weight:500;color:var(--text-secondary)}
        .recipe-actions{display:flex;gap:.5rem;flex-wrap:wrap}
        .servings-control{display:flex;align-items:center;gap:1rem;font-size:.875rem;font-weight:500;color:var(--text-secondary)}
        .servings-stepper{display:flex;align-items:center;border:1px solid var(--bg-border);border-radius:var(--radius-sm);overflow:hidden}
        .servings-stepper button{width:34px;height:34px;background:var(--bg-raised);border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--transition);color:var(--text-secondary)}
        .servings-stepper button:hover{background:var(--bg-border);color:var(--text-primary)}
        .servings-stepper span{min-width:40px;text-align:center;padding:0 .5rem;font-weight:700;font-size:1rem;color:var(--text-primary);border-left:1px solid var(--bg-border);border-right:1px solid var(--bg-border);line-height:34px}
        .tags-row{display:flex;gap:.375rem;flex-wrap:wrap}
        .market-estimate-box{background:var(--green-muted);border:1px solid rgba(44,122,75,.2);border-radius:var(--radius-md);padding:1rem 1.25rem}
        .market-estimate-title{display:flex;align-items:center;gap:.5rem;font-size:.8rem;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.75rem}
        .market-estimate-values{display:flex;gap:1.5rem}
        .market-estimate-values div{display:flex;flex-direction:column;gap:.2rem}
        .market-estimate-values div span{font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.04em}
        .market-estimate-values div strong{font-family:var(--font-display);font-size:1rem;font-weight:700;color:var(--green)}
        .market-avg strong{font-size:1.2rem!important;color:var(--accent)!important}
        .recipe-detail-content{display:grid;grid-template-columns:280px 1fr;border-top:1px solid var(--bg-border)}
        .ingredients-section{padding:2rem;border-right:1px solid var(--bg-border)}
        .ingredients-section h2,.instructions-section h2{display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700;letter-spacing:-.01em;margin-bottom:1rem}
        .ingredients-list{list-style:none}
        .ingredients-list li{display:flex;justify-content:space-between;align-items:baseline;padding:.5rem 0;border-bottom:1px solid var(--bg-border);font-size:.875rem;gap:1rem}
        .ingredients-list li:last-child{border-bottom:none}
        .ingredient-measure{color:var(--accent);font-weight:600;white-space:nowrap}
        .instructions-section{padding:2rem}
        .instructions-text p{margin-bottom:.875rem;line-height:1.75;font-size:.9rem}
        .video-section{margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--bg-border)}
        .video-section h3{font-family:var(--font-display);font-size:.9rem;font-weight:700;margin-bottom:.75rem}
        .video-link{display:inline-flex;align-items:center;gap:.5rem;padding:.625rem 1.25rem;background:#FF0000;color:white;text-decoration:none;border-radius:var(--radius-sm);font-size:.85rem;font-weight:600;transition:var(--transition)}
        .video-link:hover{opacity:.9;transform:translateY(-1px)}
        .nutrition-box{margin-top:1.5rem;padding:1.25rem;background:var(--bg-raised);border-radius:var(--radius-md)}
        .nutrition-box h3{display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:.9rem;font-weight:700;margin-bottom:.875rem;color:var(--green)}
        .nutrition-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem}
        .nutrition-item{display:flex;flex-direction:column;align-items:center;gap:.2rem;text-align:center}
        .nut-val{font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--text-primary)}
        .nut-key{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted)}
        .no-data-note{font-size:.85rem;color:var(--text-muted);font-style:italic}
        .source-link{display:inline-flex;align-items:center;gap:.375rem;color:var(--accent);text-decoration:none;font-size:.8rem;font-weight:500;transition:var(--transition)}
        .source-link:hover{opacity:.8;text-decoration:underline}

        /* ── Toast ── */
        .toast{position:fixed;top:1.5rem;right:1.5rem;display:flex;align-items:center;gap:.625rem;background:var(--text-primary);color:var(--bg-surface);padding:.75rem 1.25rem;border-radius:var(--radius-md);font-size:.875rem;font-weight:500;z-index:9999;animation:slideIn .2s ease}
        @keyframes slideIn{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}

        /* ── Forms ── */
        .recipe-form-card{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-lg);padding:1.75rem;margin-bottom:2rem}
        .recipe-form-card h3{display:flex;align-items:center;gap:.5rem;font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:1.25rem}
        .form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-bottom:.75rem}
        .form-label{font-size:.85rem;font-weight:500;color:var(--text-secondary);margin-bottom:.75rem;display:block}
        .recipe-form-card input,.recipe-form-card textarea{width:100%;padding:.625rem .875rem;border:1.5px solid var(--bg-border);border-radius:var(--radius-sm);background:var(--bg-canvas);color:var(--text-primary);font-size:.875rem;font-family:var(--font-body);transition:var(--transition)}
        .recipe-form-card input:focus,.recipe-form-card textarea:focus{outline:none;border-color:var(--accent);background:var(--bg-surface)}
        .recipe-form-card textarea{resize:vertical;margin-bottom:.75rem}
        .form-actions{display:flex;gap:.75rem;margin-top:1rem}

        /* ── Meal planner ── */
        .meal-planner-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:.75rem;overflow-x:auto;padding-bottom:.5rem}
        .day-column{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-md);overflow:hidden;min-width:130px}
        .day-header{padding:.75rem;background:var(--bg-raised);border-bottom:1px solid var(--bg-border);text-align:center}
        .day-header h3{font-family:var(--font-display);font-size:.85rem;font-weight:700}
        .day-header span{font-size:.75rem;color:var(--text-muted)}
        .meal-slot{padding:.625rem;border-bottom:1px solid var(--bg-border)}
        .meal-slot:last-child{border-bottom:none}
        .meal-slot-label{display:flex;align-items:center;gap:.375rem;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:.375rem}
        .planned-meal{position:relative}
        .planned-meal img{width:100%;border-radius:var(--radius-sm);aspect-ratio:1;object-fit:cover;display:block}
        .planned-meal p{font-size:.72rem;font-weight:500;margin-top:.25rem;line-height:1.3}
        .remove-meal-btn{position:absolute;top:.25rem;right:.25rem;width:20px;height:20px;background:rgba(0,0,0,.5);color:white;border:none;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:var(--transition)}
        .remove-meal-btn:hover{background:rgba(0,0,0,.7)}
        .add-meal-btn{width:100%;padding:.5rem;background:var(--bg-canvas);border:1.5px dashed var(--bg-border);color:var(--text-muted);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;gap:.25rem;font-size:.75rem;font-weight:500;cursor:pointer;transition:var(--transition);font-family:var(--font-body)}
        .add-meal-btn:hover{border-color:var(--accent);color:var(--accent)}

        /* ── Modal ── */
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:1.5rem}
        .modal-content{background:var(--bg-surface);border-radius:var(--radius-lg);padding:1.75rem;max-width:560px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:var(--shadow-lg)}
        .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}
        .modal-header h2{font-family:var(--font-display);font-size:1.125rem;font-weight:700}
        .modal-close{background:none;border:none;cursor:pointer;color:var(--text-muted);transition:var(--transition);display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:var(--radius-sm)}
        .modal-close:hover{background:var(--bg-raised);color:var(--text-primary)}
        .recipe-selector-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.75rem}
        .recipe-selector-item{cursor:pointer;border-radius:var(--radius-sm);overflow:hidden;border:1.5px solid var(--bg-border);transition:var(--transition)}
        .recipe-selector-item:hover{border-color:var(--accent);transform:translateY(-2px)}
        .recipe-selector-item img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
        .recipe-selector-item p{font-size:.72rem;font-weight:500;padding:.375rem;line-height:1.3}

        /* ── Shopping list ── */
        .add-item-form{display:flex;align-items:center;gap:.75rem;background:var(--bg-surface);border:1.5px solid var(--bg-border);border-radius:var(--radius-md);padding:.5rem .5rem .5rem 1.125rem;margin-bottom:2rem;transition:border-color var(--transition),box-shadow var(--transition)}
        .add-item-form:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(224,90,43,.1)}
        .add-item-input{flex:1;border:none;background:transparent;color:var(--text-primary);font-family:var(--font-body);font-size:.9rem;outline:none;padding:.375rem 0;min-width:0}
        .add-item-input::placeholder{color:var(--text-muted)}
        .add-item-form .btn-primary{padding:.5rem 1.125rem;border-radius:calc(var(--radius-sm) - 1px);font-size:.85rem;flex-shrink:0}
        .shopping-list-content{display:flex;flex-direction:column;gap:1.5rem}
        .shopping-category{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-md);overflow:hidden}
        .category-heading{padding:.75rem 1.25rem;background:var(--bg-raised);border-bottom:1px solid var(--bg-border);font-family:var(--font-display);font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-secondary)}
        .shopping-category ul{list-style:none}
        .shopping-item{display:flex;align-items:center;gap:.75rem;padding:.75rem 1.25rem;border-bottom:1px solid var(--bg-border);transition:var(--transition)}
        .shopping-item:last-child{border-bottom:none}
        .shopping-item.checked .item-name{text-decoration:line-through;color:var(--text-muted)}
        .shopping-item input[type="checkbox"]{width:17px;height:17px;flex-shrink:0;accent-color:var(--accent);cursor:pointer}
        .item-name{flex:1;font-size:.875rem}
        .remove-item-btn{background:none;border:none;cursor:pointer;color:var(--text-muted);transition:var(--transition);display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:4px;flex-shrink:0}
        .remove-item-btn:hover{background:#FEE2E2;color:#DC2626}

        /* ── Cookbook ── */
        .cookbook-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.5rem}
        .cookbook-card{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-md);overflow:hidden;transition:var(--transition);position:relative}
        .cookbook-card:hover{box-shadow:var(--shadow-md);transform:translateY(-3px)}
        .cookbook-preview{display:grid;grid-template-columns:1fr 1fr;aspect-ratio:1}
        .cookbook-preview img{width:100%;height:100%;object-fit:cover}
        .cookbook-preview-placeholder{background:var(--bg-raised)}
        .cookbook-card-info{padding:.875rem 1rem}
        .cookbook-card-info h3{font-family:var(--font-display);font-size:.9rem;font-weight:700;margin-bottom:.2rem}
        .cookbook-card-info p{font-size:.78rem;color:var(--text-muted)}
        .cookbook-card .btn-danger-sm{position:absolute;top:.5rem;right:.5rem}
        .recipe-selection-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.75rem;margin-bottom:1rem}
        .recipe-checkbox{display:block;cursor:pointer;border:1.5px solid var(--bg-border);border-radius:var(--radius-sm);overflow:hidden;transition:var(--transition);position:relative}
        .recipe-checkbox.selected{border-color:var(--accent)}
        .recipe-checkbox input{position:absolute;opacity:0;pointer-events:none}
        .recipe-checkbox img{width:100%;aspect-ratio:1;object-fit:cover;display:block}
        .recipe-checkbox span{display:block;font-size:.72rem;font-weight:500;padding:.375rem;line-height:1.3}

        /* ── Budget page ── */
        .budget-input-card{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-lg);padding:2rem;margin-bottom:2rem}
        .budget-input-card h3{font-family:var(--font-display);font-size:1.1rem;font-weight:700;margin-bottom:1.25rem}
        .budget-input-row{display:flex;gap:.75rem;align-items:center;margin-bottom:1.25rem}
        .budget-input-wrap{position:relative;flex:1;max-width:280px}
        .budget-currency{position:absolute;left:1rem;top:50%;transform:translateY(-50%);font-weight:700;color:var(--green);font-size:1.1rem;pointer-events:none}
        .budget-input{width:100%;padding:.75rem 1rem .75rem 2.5rem;border:1.5px solid var(--bg-border);border-radius:var(--radius-sm);background:var(--bg-canvas);color:var(--text-primary);font-size:1rem;font-family:var(--font-display);font-weight:600;transition:var(--transition)}
        .budget-input:focus{outline:none;border-color:var(--green)}
        .budget-presets{display:flex;gap:.5rem;flex-wrap:wrap}
        .preset-chip{padding:.4rem .875rem;border:1.5px solid var(--bg-border);background:var(--bg-raised);color:var(--text-secondary);border-radius:100px;font-size:.78rem;font-weight:500;cursor:pointer;transition:var(--transition);font-family:var(--font-body);white-space:nowrap}
        .preset-chip:hover{border-color:var(--green);color:var(--green)}
        .preset-chip.active{background:var(--green);border-color:var(--green);color:white}
        .budget-results-header{background:var(--green-muted);border:1px solid rgba(44,122,75,.2);border-radius:var(--radius-md);padding:.875rem 1.25rem;margin-bottom:1.5rem;font-size:.875rem;color:var(--green)}
        .budget-examples h3{font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:1rem}
        .budget-example-grid{display:flex;flex-direction:column;gap:.75rem}
        .budget-example-card{display:flex;align-items:center;gap:1rem;background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-md);padding:1rem 1.25rem;cursor:pointer;transition:var(--transition)}
        .budget-example-card:hover{border-color:var(--accent);transform:translateX(4px)}
        .bex-icon{font-size:1.5rem;flex-shrink:0}
        .budget-example-card div{flex:1}
        .budget-example-card h4{font-family:var(--font-display);font-size:.95rem;font-weight:700;margin-bottom:.2rem}
        .budget-example-card p{font-size:.82rem;color:var(--text-secondary)}

        /* ── Pantry page ── */
        .pantry-input-card{background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-lg);padding:2rem;margin-bottom:2rem}
        .pantry-input-card h3{font-family:var(--font-display);font-size:1.1rem;font-weight:700;margin-bottom:.5rem}
        .pantry-textarea{width:100%;padding:.875rem 1rem;border:1.5px solid var(--bg-border);border-radius:var(--radius-sm);background:var(--bg-canvas);color:var(--text-primary);font-size:.9rem;font-family:var(--font-body);resize:vertical;transition:var(--transition);margin:.75rem 0 1rem}
        .pantry-textarea:focus{outline:none;border-color:var(--purple)}
        .pantry-examples{margin-top:1.25rem}
        .example-chip{display:inline-block;margin:.25rem;padding:.35rem .75rem;background:var(--bg-raised);border:1px solid var(--bg-border);border-radius:100px;font-size:.75rem;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:var(--transition);font-family:var(--font-body)}
        .example-chip:hover{border-color:var(--purple);color:var(--purple);background:var(--purple-muted)}
        .pantry-results-header{background:var(--purple-muted);border:1px solid rgba(124,58,237,.2);border-radius:var(--radius-md);padding:.875rem 1.25rem;margin-bottom:1.5rem;font-size:.875rem;color:var(--purple)}
        .pantry-results-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
        .pantry-result-card{display:flex;gap:1rem;background:var(--bg-surface);border:1px solid var(--bg-border);border-radius:var(--radius-md);overflow:hidden;cursor:pointer;transition:var(--transition)}
        .pantry-result-card:hover{border-color:var(--purple);box-shadow:var(--shadow-sm);transform:translateY(-2px)}
        .pantry-result-card img{width:90px;height:90px;object-fit:cover;flex-shrink:0}
        .pantry-result-info{flex:1;padding:.75rem .75rem .75rem 0;display:flex;flex-direction:column;gap:.375rem}
        .pantry-result-info h3{font-family:var(--font-display);font-size:.88rem;font-weight:700;line-height:1.3}
        .match-bar-wrap{background:var(--bg-raised);border-radius:100px;height:6px;overflow:hidden}
        .match-bar{height:100%;width:var(--pct);background:linear-gradient(90deg,var(--purple),var(--accent));border-radius:100px;transition:width .4s ease}
        .match-meta{display:flex;justify-content:space-between;align-items:center}
        .match-pct{font-size:.78rem;font-weight:700;color:var(--text-muted)}
        .match-pct.mid{color:var(--gold)}
        .match-pct.high{color:var(--green)}
        .match-detail{font-size:.72rem;color:var(--text-muted)}
        .pantry-budget{display:flex;align-items:center;gap:.25rem;font-size:.72rem;font-weight:600;color:var(--green)}

        /* ── Footer ── */
        .app-footer{margin-top:4rem;border-top:1px solid var(--bg-border);padding:2rem 0 1rem}
        .footer-inner{display:flex;justify-content:space-between;align-items:flex-start;gap:2rem;flex-wrap:wrap}
        .footer-logo{display:flex;align-items:center;gap:.5rem;margin-bottom:.625rem}
        .footer-copy{font-size:.875rem;color:var(--text-secondary);margin-bottom:.25rem}
        .footer-copy strong{color:var(--text-primary);font-weight:600}
        .footer-powered{font-size:.78rem;color:var(--text-muted)}
        .footer-powered a{color:var(--accent);text-decoration:none;font-weight:500}
        .footer-powered a:hover{text-decoration:underline}
        .footer-socials{display:flex;gap:.625rem;flex-wrap:wrap;align-items:center}
        .social-link{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem .875rem;border:1.5px solid var(--bg-border);border-radius:var(--radius-sm);color:var(--text-secondary);text-decoration:none;font-size:.83rem;font-weight:500;transition:var(--transition);background:var(--bg-surface)}
        .social-link:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-muted);transform:translateY(-1px)}

        /* ── Responsive ── */
        @media(max-width:1100px){
          :root{--sidebar-width:210px}
          .main-content{padding:1.5rem 2rem}
          .recipe-detail-header{grid-template-columns:1fr;display:flex;flex-direction:column}
          .recipe-detail-header:not(.recipe-detail-header--sp) .recipe-detail-image{min-height:280px;max-height:320px}
          .recipe-detail-content{grid-template-columns:1fr}
          .ingredients-section{border-right:none;border-bottom:1px solid var(--bg-border)}
          .meal-planner-grid{grid-template-columns:repeat(4,1fr)}
          .tribe-cards{grid-template-columns:1fr}
          .hero-title{font-size:2.25rem}
        }
        @media(max-width:768px){
          :root{--sidebar-width:0px}
          .sidebar{display:none}
          .mobile-header{display:flex}
          .main-content{margin-left:0;padding:1rem 1.25rem 2.5rem;max-width:100vw;padding-top:calc(56px + 1.25rem)}
          .hero-section{padding:2.5rem 1.5rem;border-radius:var(--radius-lg)}
          .hero-title{font-size:1.75rem}
          .hero-subtitle{font-size:.95rem}
          .search-bar{flex-direction:column}
          .search-btn{width:100%}
          .recipe-grid{grid-template-columns:repeat(2,1fr);gap:.875rem}
          .pantry-results-grid{grid-template-columns:1fr}
          .meal-planner-grid{grid-template-columns:repeat(3,1fr)}
          .page-header{flex-direction:column;gap:.75rem}
          .page-header h1{font-size:1.5rem}
          .features-grid{grid-template-columns:1fr 1fr}
          .recipe-detail-header,.recipe-detail-header--sp{flex-direction:column}
          .recipe-detail-header:not(.recipe-detail-header--sp) .recipe-detail-image{min-height:220px;max-height:260px}
          .recipe-detail-header--sp .recipe-detail-image{height:220px}
          .recipe-detail-info{padding:1.25rem}
          .recipe-actions{flex-direction:column}
          .recipe-actions .btn-action{justify-content:center}
          .market-estimate-values{flex-direction:column;gap:.75rem}
          .nutrition-grid{grid-template-columns:repeat(2,1fr)}
          .budget-input-row{flex-direction:column;align-items:stretch}
          .budget-input-wrap{max-width:100%}
          .tribe-cards{grid-template-columns:1fr}
        }
        @media(max-width:480px){
          .hero-title{font-size:1.5rem}
          .recipe-grid{grid-template-columns:1fr}
          .features-grid{grid-template-columns:1fr}
          .meal-planner-grid{grid-template-columns:repeat(2,1fr)}
        }
        @media print{
          .sidebar,.mobile-header,.back-btn,.recipe-actions,.page-header button{display:none}
          .main-content{margin-left:0;padding:0}
        }
      `}</style>
    </Router>
  );
};

export default App;
