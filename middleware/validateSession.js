// VALIDATE SESSION MIDDLEWARE GOES HERE
const jwt = require("jsonwebtoken");
const { User } = require("../models")

const validateSession = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).send({ auth: false, message: "🛑 No token provided 🛑" });  
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodeToken) => {
      if (!err && decodeToken) {
        User.findOne({
          where: {
            id: decodeToken.id,
          },
        })
          .then((user) => {
            if (!user) throw err;
            req.user = user;
            return next();
          })
          .catch((err) => next(err));
      } else {
        req.errors = err;
        return res.status(500).send("🚫 Not Authorized 🚫");  
      }
    })
  }
};
module.exports = validateSession;
