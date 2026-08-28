// server.js
const http = require('http');
require('dotenv').config();
const { app, connectDB } = require('./app');

const port = process.env.PORT || 4000;

const errorHandler = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind =
    typeof address === 'string' ? `pipe ${address}` : `port ${port}`;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const server = http.createServer(app);

server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind =
    typeof address === 'string' ? `pipe ${address}` : `port ${port}`;
  console.log(`Mon Vieux Grimoire API listening on ${bind}`);
});

// Connect to the database first, then open the HTTP port
connectDB()
  .then(() => server.listen(port))
  .catch((err) => {
    console.error('Fatal: could not start the server.', err);
    process.exit(1);
  });