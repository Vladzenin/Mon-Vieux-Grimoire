const multer = require("multer");

// Authorized image extensions
const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};

// Stores downloaded images in the 'images' folder
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "images");
    },
    filename: (req, file, callback) => {
        // Replaces spaces with underscores in the original filename
        const name = file.originalname.split(" ").join("_").replace(/\.[^/.]+$/, "");
        const extension = MIME_TYPES[file.mimetype];

        let fileName;
        if (req.body.bookId) {
            // Modifies file name to include book ID
            fileName = req.body.bookId + "_" + name + "_" + Date.now() + "." + extension;
        } else {
            // If bookId is undefined, keeps original file name
            fileName = name + "_" + Date.now() + "." + extension;
        }

        callback(null, fileName);
    },
});

// Sets a file limit of 2MB
module.exports = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
}).single("image");
