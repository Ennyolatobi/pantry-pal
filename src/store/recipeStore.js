import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function for categorizing ingredients
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
    if (items.some(item => lowerIngredient.includes(item))) {
      return category;
    }
  }
  return 'Other';
};

const useRecipeStore = create(
  persist(
    (set, get) => ({
      favorites: [],
      myRecipes: [],
      shoppingList: [],
      mealPlan: {},
      cookbooks: [],
      theme: 'light',
      
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
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
    {
      name: 'recipe-keeper-storage'
    }
  )
);

export default useRecipeStore;