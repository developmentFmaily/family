/**
 * Request Logging Middleware
 * Logs all incoming requests with relevant information
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`📤 ${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = {
  requestLogger
};
