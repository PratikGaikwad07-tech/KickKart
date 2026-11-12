
const jwt = require("jsonwebtoken");
require("dotenv").config();

const token = jwt.sign(
  {
    id: 6,
    email: "sahil@test.com",
    role: "admin"
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1d"
  }
);

console.log("\nADMIN JWT TOKEN:\n");
console.log(token);
