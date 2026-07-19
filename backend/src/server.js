import { envConfig } from "../config/env.js";
import app from "./app.js";

const PORT = envConfig.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});