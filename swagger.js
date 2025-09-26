// swagger.js
import swaggerJsdoc from 'swagger-jsdoc';

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

const specs = swaggerJsdoc(options);

export default specs;