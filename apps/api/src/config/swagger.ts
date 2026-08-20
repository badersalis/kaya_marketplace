import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const isTs = __filename.endsWith(".ts");

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Kaya API",
      version: "1.0.0",
      description:
        "Cross-border order & delivery orchestration platform — REST API for the Kaya dashboard.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: { type: "object", nullable: true },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // swagger-jsdoc's glob matcher treats "\" as an escape char, so Windows'
  // native backslash-separated paths silently match zero files — normalize
  // to forward slashes before handing the pattern off.
  apis: [path.join(__dirname, `../modules/**/*.${isTs ? "ts" : "js"}`).split(path.sep).join("/")],
});
