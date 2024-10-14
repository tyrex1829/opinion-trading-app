import express from "express";

const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  console.log("Landing page");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
