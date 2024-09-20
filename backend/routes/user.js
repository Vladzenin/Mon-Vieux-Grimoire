const express = require ('express');
const router = express.Router();

const userController = require ('../controllers/user');

// Create a new user in the database
    router.post('/signup', userController.signup);
// Check if user exists
    router.post('/login', userController.login);

module.exports = router;