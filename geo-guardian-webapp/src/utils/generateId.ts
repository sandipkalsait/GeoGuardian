// src/utils/generateId.ts
export const generateId = (prefix = "") => {
  // short readable id
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}-${id}` : id;
};
