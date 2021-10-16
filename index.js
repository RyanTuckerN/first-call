require("dotenv").config();
const express = require("express"),
  db = require("./db"),
  app = express(),
  PORT = process.env.PORT,
  controllers = require("./controllers"),
  server = app.listen(PORT, () =>
    console.log(`🚢 Server listening on port ${PORT} 🚢`)
  );

db.sync({ 
  // force: true 
});

app.use(express.json());
app.use(require('./middleware/headers'))

app.use("/user", controllers.user);
app.use("/gig", controllers.gig);
app.use("/board", controllers.messageboard);
app.use("/open", controllers.open);
app.use("/", (req, res) =>
  res
    .status(200)
    .json({ message: `App is up and running on port ${PORT}`, server })
);
