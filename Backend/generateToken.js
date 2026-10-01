const jwt = require("jsonwebtoken");
require("dotenv").config();

const token = jwt.sign(
  {
    id: 6,
    email: "sahil@test.com",
    role: "user"
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1d"
  }
);

console.log("\nJWT TOKEN:\n");
console.log(token);