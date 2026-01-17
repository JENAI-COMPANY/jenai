import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedFavorites = localStorage.getItem(`favorites_${user._id}`);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, user]);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem(`favorites_${user._id}`, JSON.stringify(favorites));
    }
  }, [favorites, isAuthenticated, user]);

  const addToFavorites = (productId) => {
    if (!favorites.includes(productId)) {
      setFavorites([...favorites, productId]);
    }
  };

  const removeFromFavorites = (productId) => {
    setFavorites(favorites.filter(id => id !== productId));
  };

  const toggleFavorite = (productId) => {
    if (favorites.includes(productId)) {
      removeFromFavorites(productId);
    } else {
      addToFavorites(productId);
    }
  };

  const isFavorite = (productId) => {
    return favorites.includes(productId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
