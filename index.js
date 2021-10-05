require("dotenv").config();
const express = require("express");
const db = require("./db");
const app = express();
const PORT = process.env.PORT;
const controllers = require("./controllers");
const server = app.listen(PORT, () =>
  console.log(`🚢 Server listening on port ${PORT} 🚢`)
);

db.sync(
  // {force: true}
  );

app.use(express.json());

app.use("/user", controllers.user);
app.use("/gig", controllers.gig);
app.use("/notification", controllers.notification);
app.use("/board", controllers.messageboard);
app.use("/", (req, res) =>
  res
    .status(200)
    .json({ message: `App is up and running on port ${PORT}, check your endpoint!!`, server })
);
