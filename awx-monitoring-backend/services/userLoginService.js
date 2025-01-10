require("dotenv").config();

const express = require("express");
const app = express();
app.use(express.json());

app.post("/validate-credentials", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.USUARIO_PARCIAL &&
    password === process.env.PASSWORD_PARCIAL
  ) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false, message: "Credenciales incorrectas" });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
