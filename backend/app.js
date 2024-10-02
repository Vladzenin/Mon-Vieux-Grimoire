require("dotenv").config();

const express = require('express');
const mongoose = require('mongoose');
const Book = require ('./models/Book');
const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');

const app = express();
const path = require ('path');

const databaseConfig = require("./configs/databaseConfig");

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

mongoose
    .connect(databaseConfig.dbUri)
    .then(() => console.log("Connexion à MongoDB réussie !"))
    .catch((error) => console.log("Connexion à MongoDB échouée !", error));

app.use(express.json());

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;