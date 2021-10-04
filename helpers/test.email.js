const newEmail = require("./newEmail.js");

newEmail("test", 400, 4, "test2", {
  role: "bass",
  body: "This is the body of the email. It is rendered in a <p> tag!",
  subject: "This is a test subject line",
});
