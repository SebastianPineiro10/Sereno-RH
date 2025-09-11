// src/lib/storage.js
// Funciones de utilidad para manejar la persistencia de datos en localStorage.

import { seedEmployeesData, seedCheckinsData, seedRewardsData, seedGoalsData } from '../data/seedData';

export const STORAGE_KEYS = {
  employees: 'sereno-rh-employees',
  checkins: 'sereno-rh-checkins',
  rewards: 'sereno-rh-rewards',
  goals: 'sereno-rh-goals',
  passwords: 'sereno-rh-passwords',
};

export const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error al obtener datos de localStorage:', error);
    return null;
  }
};

export const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error al guardar datos en localStorage:', error);
  }
};

export const seedStorage = () => {
  if (!getStorageData(STORAGE_KEYS.employees)) {
    setStorageData(STORAGE_KEYS.employees, seedEmployeesData);
  }
  if (!getStorageData(STORAGE_KEYS.checkins)) {
    setStorageData(STORAGE_KEYS.checkins, seedCheckinsData);
  }
  if (!getStorageData(STORAGE_KEYS.rewards)) {
    setStorageData(STORAGE_KEYS.rewards, seedRewardsData);
  }
  if (!getStorageData(STORAGE_KEYS.goals)) {
    setStorageData(STORAGE_KEYS.goals, seedGoalsData);
  }
  // Se agrega un objeto de contraseñas para los usuarios iniciales.
  if (!getStorageData(STORAGE_KEYS.passwords)) {
    const initialPasswords = {
      'admin@serenorh.com': 'admin123',
      'perez@serenorh.com': 'empleado123',
      'marta.lopez@serenorh.com': 'martha123'

    };
    setStorageData(STORAGE_KEYS.passwords, initialPasswords);
  }
};