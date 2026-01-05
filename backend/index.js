require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection (PostgreSQL)
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// Mock DB for demonstration if Postgres isn't running
const listings = [];

// Routes
app.get('/', (req, res) => {
  res.send('DealShield API is running');
});

// Get all listings
app.get('/api/listings', async (req, res) => {
  try {
    // const result = await pool.query('SELECT * FROM listings ORDER BY created_at DESC');
    // res.json(result.rows);
    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Create a listing
app.post('/api/listings', async (req, res) => {
  const { title, description, price, seller, image, category } = req.body;
  
  try {
    // const query = `
    //   INSERT INTO listings (title, description, price, seller, image, category, created_at)
    //   VALUES ($1, $2, $3, $4, $5, $6, NOW())
    //   RETURNING *
    // `;
    // const values = [title, description, price, seller, image, category];
    // const result = await pool.query(query, values);
    // res.status(201).json(result.rows[0]);
    
    const newListing = {
      id: listings.length + 1,
      title,
      description,
      price,
      seller,
      image,
      category,
      created_at: new Date()
    };
    listings.push(newListing);
    res.status(201).json(newListing);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Webhook for on-chain events (e.g. from Helius)
app.post('/api/webhook', (req, res) => {
  const event = req.body;
  console.log('Received on-chain event:', event);
  
  // Logic to update listing status based on Escrow events
  // ...

  res.status(200).send('Received');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
