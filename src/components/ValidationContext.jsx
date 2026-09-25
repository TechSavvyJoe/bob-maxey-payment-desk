import { createContext, useContext } from 'react';

export const ValidationContext = createContext(null);
export function useFieldValidation() { return useContext(ValidationContext); }
