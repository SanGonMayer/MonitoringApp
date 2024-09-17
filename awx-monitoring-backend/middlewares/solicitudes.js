import { format } from 'date-fns';  

export const requestLoggerMiddleware = ({ dateFormat = 'yyyy-MM-dd HH:mm:ss' } = {}) => {
    return (req, res, next) => {
      const now = new Date();
      const formattedDate = format(now, dateFormat);
      console.log(`[${formattedDate}] ${req.method} ${req.url}`);
      next(); // Pasa al siguiente middleware o ruta
    };
  };