const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints
app.get('/api/gameState', (req, res) => {
  // In a real app, this would come from a database
  res.json({
    score: 0,
    money: 100,
    inventory: [],
    seeds: [
      { id: 'red_seed', name: 'Red Seed', red: 125, green: 0, blue: 0, cost: 10 },
      { id: 'green_seed', name: 'Green Seed', red: 0, green: 125, blue: 0, cost: 10 },
      { id: 'blue_seed', name: 'Blue Seed', red: 0, green: 0, blue: 125, cost: 10 }
    ]
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});