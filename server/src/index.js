const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");


const swaggerSpec = require("../config/swagger");

dotenv.config();

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:8080"],
  credentials: true,              
}));
app.use(cookieParser());

app.use(express.json());

const authRoutes = require("./auth/auth.routes");
const adminRoutes = require("./admin/admin.routes");
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));