<div align="center">

# PantryPal

**An African-first recipe manager built with React 19**

Discover curated Nigerian & African recipes alongside 10,000+ global dishes. Plan meals, match your pantry, cook within budget, and build beautiful cookbooks.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white&style=flat-square)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5.x-433e38?style=flat-square)](https://zustand-demo.pmnd.rs)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [Data Schema](#data-schema) · [Roadmap](#roadmap)

</div>

---

## Overview

PantryPal is a single-page React application built around an African-first philosophy. It ships with a fully curated local database of 70+ Nigerian and African recipes with regional context, tribal attribution, market pricing in Naira, and nutritional data alongside the global TheMealDB catalogue.

No backend, no paid API, no account required. Everything runs in the browser.

---

## Features

### African Kitchen
- 60 curated Nigerian recipes spanning all regions, Yoruba, Igbo, Hausa, Delta, Cross River
- 10 additional African country recipes, Ghana, Ethiopia, Kenya, South Africa, Senegal, Morocco
- Tribe filter (Yoruba / Igbo / Hausa), country filter, breakfast section
- Visual tribal cuisine cards on the explore page
- Every recipe includes description, difficulty, cook time, servings, tags, and aliases

### Intelligent Search
- Searches across recipe name, aliases, keywords, tags, ingredients, tribe, country, and category simultaneously
- Typo-tolerant matching via Levenshtein distance (up to 2 character errors forgiven)
- Example: searching "moin moin", "moi moi", or "bean pudding" all find the same recipe

### Budget Meal Finder
- Enter any Naira amount and see every recipe cookable within that budget
- Six quick-select preset budgets (₦1,500 to ₦10,000)
- Results sorted cheapest first
- Every local recipe displays its estimated low / average / high market cost

### Pantry Matcher
- Enter the ingredients you currently have
- App scores every local recipe by percentage ingredient match
- Only shows recipes where you have at least 30% of ingredients
- Ranked by match percentage with a visual progress bar
- Shows missing ingredient count alongside matched count

### Meal Planning
- 7-day visual meal planner showing the current week
- Four meal slots per day: Breakfast, Lunch, Dinner, Snack
- Pick from saved favourites directly inside the planner

### Shopping List
- Add all ingredients from any recipe in one tap
- Add items manually with the inline quick-add input
- Items auto-categorised (Produce, Meat, Dairy, Pantry, Spices, Other)
- Check off items as you shop, clear checked items in bulk, print the list

### Cookbooks
- Group saved recipes into named cookbook collections
- 2×2 photo grid preview on each cookbook card

### Personal Library
- Favourites, custom recipes, recently viewed (last 12), all persisted in localStorage

---

## Getting Started

### Prerequisites
- Node.js v18+ (LTS recommended)

### Install and run

```bash
# Unzip the project
unzip pantrypal-v6.zip
cd pantrypal-updated

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

### Deploying to Vercel

The project includes `vercel.json` for client-side routing and `.npmrc` for the peer dependency flag. Push to GitHub and connect to Vercel, it will deploy without any extra configuration.

For environment variables: none are required. TheMealDB is a free public API with no key.

---

## Project Structure

```
pantrypal/
├── src/
│   ├── App.jsx                    # All components, pages, routing, styles
│   ├── data/
│   │   └── recipes/
│   │       ├── nigerianRecipes.json   # 60 Nigerian dishes
│   │       └── africanRecipes.json    # 10 African country dishes
│   ├── services/
│   │   └── recipeService.js       # Data layer — search, filter, normalise, merge
│   └── main.jsx
├── public/
├── .npmrc                         # legacy-peer-deps=true (for Vercel)
├── vercel.json                    # SPA routing rewrites
├── package.json
└── vite.config.js
```

---

## Architecture

### Data Layer (`recipeService.js`)

All data access goes through `recipeService.js`. It exposes:

| Export | Description |
|---|---|
| `searchAllRecipes(query, filter)` | Unified search across local + TheMealDB |
| `getRecipeById(id)` | Looks up local first, then TheMealDB |
| `filterByMaxBudget(nairaAmount)` | Returns local recipes under a budget, sorted cheapest first |
| `pantryMatch(ingredientArray)` | Scores and ranks local recipes by ingredient overlap |
| `getByTribe(tribe)` | Filter by Yoruba / Igbo / Hausa |
| `getByCountry(country)` | Filter by country |
| `getBreakfast()` | All breakfast-tagged recipes |
| `getTrending()` | Recipes tagged as party food, street food, or national favourites |
| `ALL_LOCAL_RECIPES` | All 70 normalised local recipes |
| `NIGERIAN_RECIPES` | 60 Nigerian recipes only |
| `AFRICAN_RECIPES` | 10 non-Nigerian African recipes |

### Search Algorithm

```
recipeMatchesQuery(recipe, query)
  → splits query into individual words
  → for each word, checks:
      recipe name, category, area, tribe, country, region,
      mealType, description, aliases[], keywords[], tags[],
      strIngredient1…strIngredient20
  → match = exact substring OR levenshtein(field, word) ≤ 2
  → ALL words must match (AND logic)
```

### Local Recipe Shape

```json
{
  "id": "ng001",
  "name": "Jollof Rice",
  "aliases": ["Party Rice", "Nigerian Jollof"],
  "keywords": ["rice", "smoky rice", "tomato rice", "one pot"],
  "category": "Main Course",
  "region": "National",
  "tribe": "All",
  "country": "Nigeria",
  "budgetLevel": "medium",
  "cookTime": "60 mins",
  "servings": 6,
  "difficulty": "Medium",
  "mealType": "Lunch",
  "image": "https://...",
  "description": "Nigeria's most celebrated dish…",
  "ingredients": ["3 cups long grain parboiled rice", "…"],
  "instructions": ["Step 1…", "Step 2…"],
  "nutrition": { "calories": 420, "protein": "8g", "carbs": "72g", "fat": "12g" },
  "marketEstimate": { "lowBudget": 2500, "average": 4000, "high": 6000, "currency": "NGN" },
  "tags": ["party food", "rice", "tomato", "national favourite"]
}
```

### State Management (Zustand + persist)

```
useRecipeStore (localStorage)
├── favorites[]
├── myRecipes[]
├── shoppingList[]          ← items auto-categorised on add
├── mealPlan{}              ← keyed by ISO date → meal slot → recipe
├── cookbooks[]
├── recentlyViewed[]        ← capped at 12, LIFO
└── theme: 'light' | 'dark'
```

### Route Map

| Route | Page |
|---|---|
| `/` | Home (trending, breakfast, western featured, recently viewed) |
| `/explore` | African Kitchen (all local recipes + tribe/country filters) |
| `/search` | Global search (local + TheMealDB merged) |
| `/recipe/:id` | Recipe detail (local or TheMealDB) |
| `/favorites` | Saved favourites |
| `/my-recipes` | Custom user recipes |
| `/meal-planner` | 7-day planner |
| `/shopping-list` | Shopping list with manual add |
| `/cookbook` | Cookbook collections |
| `/budget` | Budget meal finder |
| `/pantry` | Pantry ingredient matcher |

---

## Data Schema

### Adding New Recipes

To add a recipe, append a new object to `src/data/recipes/nigerianRecipes.json` or `africanRecipes.json`. Follow this schema:

```json
{
  "id": "ng061",
  "name": "Recipe Name",
  "aliases": ["Alternative Name 1", "Alternative Name 2"],
  "keywords": ["searchable term", "another term"],
  "category": "Main Course | Soup | Snack | Side Dish | Swallow | Breakfast | Drink | Grilled | Appetiser",
  "region": "North | South East | South West | South South | National",
  "tribe": "Hausa | Yoruba | Igbo | Ijaw | Efik | Urhobo | All",
  "country": "Nigeria",
  "budgetLevel": "low | medium | high",
  "cookTime": "30 mins",
  "servings": 4,
  "difficulty": "Easy | Medium | Hard",
  "mealType": "Breakfast | Lunch | Dinner | Snack",
  "image": "https://images.unsplash.com/...",
  "description": "One to two sentence description of the dish.",
  "ingredients": [
    "quantity unit ingredient name",
    "..."
  ],
  "instructions": [
    "Step 1 text.",
    "Step 2 text."
  ],
  "nutrition": { "calories": 0, "protein": "0g", "carbs": "0g", "fat": "0g" },
  "marketEstimate": { "lowBudget": 0, "average": 0, "high": 0, "currency": "NGN" },
  "tags": ["tag1", "tag2"]
}
```

The `normaliseLocal()` function in `recipeService.js` handles converting this to the app's internal shape automatically — no other code changes needed.

---

## Roadmap

- [ ] Supabase backend migration, community recipe submissions
- [ ] Recipe ratings and reviews
- [ ] Cookbook PDF export
- [ ] Serving size scaling (ingredient amounts adjust with servings stepper)
- [ ] Nutritional totals for meal plan
- [ ] Voice search (Web Speech API)
- [ ] Offline support via Service Worker
- [ ] More African countries, Cameroon, Côte d'Ivoire, Egypt, Tanzania

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'feat: description'`
4. Push and open a pull request against `main`

To add recipes only, edit the JSON files directly, no code knowledge required.

---

## License

MIT | see [LICENSE](LICENSE)

---

## Acknowledgements

- Global recipe data: [TheMealDB](https://www.themealdb.com) (free, public API)
- Icons: [Lucide React](https://lucide.dev)
- Typography: [Sora](https://fonts.google.com/specimen/Sora) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts
- Recipe images: [Unsplash](https://unsplash.com)

---

<div align="center">

Built with care by **Eniola Omoniyi**

</div>
