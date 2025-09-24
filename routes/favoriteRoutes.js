const express = require("express");
const FavoriteController = require("../controllers/FavoriteController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, (req, res, next) => FavoriteController.listMyFavorites(req, res, next));
router.post("/:post_id", authMiddleware, (req, res, next) => FavoriteController.add(req, res, next));
router.delete("/:post_id", authMiddleware, (req, res, next) => FavoriteController.remove(req, res, next));

module.exports = router;
