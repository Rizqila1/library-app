import express from "express";
import cors from "cors";
import { PORT } from "./src/config/secret.js";

// IMPORTING ROUTERS
import r_users from "./src/routers/r_users.js";
import r_roles from "./src/routers/r_roles.js";
import r_tokens from "./src/routers/r_tokens.js";
import r_books from "./src/routers/r_books.js";
import r_borrowing from "./src/routers/r_borrowing.js";
import r_categories from "./src/routers/r_categories.js";
import seed from "./src/seed/seed.js";

const app = express();

app.use(
  cors({
    methods: "GET, POST, OPTIONS, PUT, PATCH, DELETE",
    setHeader:
      "accept-language, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With",
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// SEEDING DB
await seed();

// ROUTERS
app.use("/api/v1", r_users);
app.use("/api/v1", r_roles);
app.use("/api/v1", r_tokens);
app.use("/api/v1", r_books);
app.use("/api/v1", r_borrowing);
app.use("/api/v1", r_categories);

// Default Page
app.use("/", (req, res) => {
  res.status(200).send({
    code: 404,
    message: "404 Page",
  });
});

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
