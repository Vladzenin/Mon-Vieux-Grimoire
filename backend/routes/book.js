const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const sharp = require('../middleware/sharp-config');

const bookController = require('../controllers/book')

// Create book rating
router.post("/:id/rating", auth, bookController.setRating);
// Create a new book in the database
router.post('/', auth, multer, sharp, bookController.createBook);

// Return best rated books
router.get("/bestrating", bookController.getBestBook);
// Return all books in the database
router.get('/', bookController.getAllBooks);
// Return the single book with the provided _id
router.get('/:id', bookController.getOneBook);

// Update the book with the provided  _id  with the data provided in the request body.
router.put('/:id', auth, multer, sharp, bookController.updateBook);

// Delete the single book with the provided _id
router.delete('/:id', auth, bookController.deleteBook);

module.exports = router;