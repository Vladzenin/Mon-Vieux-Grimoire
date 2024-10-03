const Book = require('../models/Book');
const fs = require('fs');

// Create book rating
exports.setRating = (req, res, next) => {
    const user = req.body.userId;
    const grade = req.body.rating;

    // Checks if rating is a number between 1 and 5
    if (isNaN(grade) || grade < 1 || grade > 5) {
        return res.status(400).json({ message: "La note doit être comprise entre 1 et 5." });
    }

    // Checks if user has auth to rate book
    if (user !== req.auth.userId) {
        return res.status(403).json({ message: "Non autorisé" });
    }

    // Finds book and updates it
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: "Livre non trouvé" });
            }

            // Checks if user has already rated the book
            if (book.ratings.some(rating => rating.userId.toString() === user.toString())) {
                return res.status(401).json({ message: "Livre déjà noté" });
            }

            // Adds new rating to book
            const newRating = {
                userId: user,
                grade: grade,
            };
            book.ratings.push(newRating);

            // Calc average rating
            const totalRatings = book.ratings.reduce((acc, curr) => acc + Number(curr.grade), 0);
            book.averageRating = Math.round((totalRatings / book.ratings.length) * 10) / 10;

            return book.save();
        })
        .then(updatedBook => {
            res.status(200).json(updatedBook);
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};


// Create a new book in the database
exports.createBook = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: "Vous devez ajouter une image pour créer un livre." });
    }

    let bookObject;
    try {
        bookObject = JSON.parse(req.body.book);

        // Prevents the book from being saved if the rating is not given by user
        if (!bookObject.averageRating || bookObject.averageRating < 1 || bookObject.averageRating > 5) {
            fs.unlink(req.file.path, () => { // Deletes book image
                console.log("Image supprimée car la note moyenne n'est pas valide.");
            });
            return res.status(400).json({ message: "Vous devez attribuer une note entre 1 et 5 pour créer un livre." });
        }

        if (!bookObject.ratings || !bookObject.ratings.length || bookObject.ratings.some(r => r.grade < 1 || r.grade > 5)) {
            fs.unlink(req.file.path, () => { // Deletes book image
                console.log("Image supprimée car les notes fournies ne sont pas valides.");
            });
            return res.status(400).json({ message: "Vous devez attribuer une note valide au livre." });
        }

        delete bookObject._id;
        delete bookObject._userId;

    } catch (error) {
        fs.unlink(req.file.path, () => { // Deletes book image
            console.log("Image supprimée car les données du livre sont invalides.");
        });
        return res.status(400).json({ message: "Les données du livre sont invalides. Veuillez réessayer." });
    }

    // if everything else succeeds, proceed to create book and save it
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename.split(".")[0]}.webp`,
    });

    book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré avec succès.' }))
        .catch((error) => {
            fs.unlink(req.file.path, () => { // Deletes book
                console.log("Image supprimée en raison d'une erreur de sauvegarde du livre.");
                res.status(500).json({ error });
            });
        });
};

// Return top rated books
exports.getBestBook = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(400).json({ error }));
};

// Return all books in the database
exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then((books) => {
            res.status(200).json(books);
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

// Return the single book with the provided _id
exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: "Livre non trouvé" });
            }
            res.status(200).json(book);
        })
        .catch((error) => {
            res.status(404).json({ error });
        });
};

// Update the book with the provided _id with the data provided in the request body.
exports.updateBook = (req, res, next) => {
    const bookObject = req.file
        ? // Update info if new image
          {
              ...JSON.parse(req.body.book),
              imageUrl: `${req.protocol}://${req.get("host")}/images/${
                  req.file.filename.split(".")[0]
              }.webp`,
          }
        : { ...req.body };

    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: "Utilisateur non autorisé" });
            } else {
                // Gets image name
                const oldPicture = book.imageUrl.split("/").pop();

                Book.updateOne({ _id: req.params.id }, { ...bookObject })

                    .then(() => {
                        // Deletes old image if new one is uploaded
                        if (req.file) {
                            fs.unlink(`images/${oldPicture}`, (err) => {
                                if (err) {
                                    res.status(500).json({ error: err });
                                } else {
                                    res.status(200).json({
                                        message: "Livre modifié",
                                    });
                                }
                            });
                        } else {
                            res.status(200).json({ message: "Livre modifié" });
                        }
                    })
                    .catch((error) => res.status(400).json({ error }));
            }
        })
        .catch((error) => res.status(500).json({ error }));
};



// Delete the single book with the provided _id
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: "Livre non trouvé" });
            }
            if (book.userId != req.auth.userId) {
                return res.status(403).json({ message: 'Non autorisé' });
            }
            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({ _id: req.params.id })
                    .then(() => { res.status(200).json({ message: 'Livre supprimé !' }) })
                    .catch(error => res.status(403).json({ error }));
            });
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};