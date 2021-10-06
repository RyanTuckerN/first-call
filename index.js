require("dotenv").config();
const express = require("express"),
 db = require("./db"),
 app = express(),
 PORT = process.env.PORT,
 controllers = require("./controllers"),
 server = app.listen(PORT, () =>
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
