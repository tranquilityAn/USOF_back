// swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

const options = {
    // Опис API
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Your API",
            version: "1.0.0",
            description: "A description of your API.",
        },
        servers: [
            {
                url: "http://localhost:3000/api", // Базовий URL для вашого API
            },
        ],
    },
    // Шляхи до файлів з маршрутами, де знаходяться коментарі
    apis: ["./routes/*.js"], 
};

// const specs = swaggerJsdoc(options);
const spec = yaml.load(fs.readFileSync('./openapi-usof.yaml', 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));

export default specs;