const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const commentRoutes = require('./routes/commentRoutes');
const likeRoutes = require('./routes/likeRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

dotenv.config();

const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./swagger");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/static/avatars', express.static(
    path.join(process.cwd(), 'uploads', 'avatars'),
    { immutable: true, maxAge: '30d' }
));

app.use((req, _res, next) => {
    const time = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;

    // кольори
    const reset = '\x1b[0m';
    const cyan = '\x1b[36m';
    const yellow = '\x1b[33m';
    const green = '\x1b[32m';

    console.log(
        `[${cyan}${time}${reset}] ${yellow}${method}${reset} ${green}${url}${reset}`
    );

    next();
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/posts/:post_id/comments', commentRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
// global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
