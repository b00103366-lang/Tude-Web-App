import app from "./app";

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (!process.env["DATABASE_URL"]) {
  throw new Error("DATABASE_URL environment variable is required but was not provided.");
}

if (!process.env["TOKEN_SECRET"] || process.env["TOKEN_SECRET"].length < 32) {
  throw new Error(
    "TOKEN_SECRET environment variable is required and must be at least 32 characters long."
  );
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
