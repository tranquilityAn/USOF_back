// const express = require('express');
// const LikeController = require('../controllers/LikeController');
// //const authMiddleware = require('../middlewares/authMiddleware');
// const { authMiddleware } = require('../middlewares/authMiddleware'); 

// const router = express.Router();

// // --- PUBLIC ---
// router.get('/', LikeController.getLikes); // GET /api/posts/:post_id/likes

// // --- PROTECTED ---
// router.post('/', authMiddleware, LikeController.addLike); // POST
// router.delete('/', authMiddleware, LikeController.removeLike); // DELETE

// module.exports = router;
// routes/likeRoutes.js
const express = require("express");
const LikeController = require("../controllers/LikeController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Ждём, что родительский роутер уже проставил req.entityType и req.entityId
// router.get("/", LikeController.getLikes);
// router.post("/", authMiddleware, LikeController.addLike);
// router.delete("/", authMiddleware, LikeController.removeLike);
router.get("/", (req, res, next) => LikeController.getLikes(req, res, next));
router.post("/", authMiddleware, (req, res, next) => LikeController.addLike(req, res, next));
router.delete("/", authMiddleware, (req, res, next) => LikeController.removeLike(req, res, next));

module.exports = router;
