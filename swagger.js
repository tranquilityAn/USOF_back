import fs from 'fs';
import yaml from 'js-yaml';

const openapiPath = new URL('./openapi-usof.yaml', import.meta.url);
export const swaggerSpec = yaml.load(fs.readFileSync(openapiPath, 'utf8'));
