// src/docs/swaggerConfig.js

import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";

const swaggerDocument = YAML.load(path.resolve("src/docs/index.yaml"));

const setupSwagger = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: "Capstone API Docs",
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
};

export default setupSwagger;
