const sharp = require("sharp");
const fse = require('fs-extra');

// Disables sharp caching, useful for avoiding weird behaviours where images wouldnt be deleted from 'images' folder
sharp.cache(false);

module.exports = async (req, res, next) => {
    if (!req.file) return next();

    const originalFilePath = req.file.path;
    const newFilePath = originalFilePath.replace(/\.[^/.]+$/, "") + ".webp";

    try {
        // Convert image to WebP
        await sharp(originalFilePath)
            .webp({ quality: 80 })
            .toFile(newFilePath);

        // Delete original image after conversion
        await fse.remove(originalFilePath).catch((error) => {
            console.error(`Erreur lors de la tentative de suppression du fichier original : ${originalFilePath}`, error);
        });

        // Update file path in request to use new WebP file
        req.file.path = newFilePath;
        next();
    } catch (error) {
        console.error("Erreur lors de la conversion ou de la suppression du fichier : ", error);
        res.status(500).json({ error: "Impossible d'optimiser l'image" });
    }
};
