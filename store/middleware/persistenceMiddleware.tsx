// Middleware to handle side effects like navigation and toasts
export const persistenceMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // You can add custom logic here for specific actions
  // For example, logging, analytics, or triggering side effects

  return result;
};
