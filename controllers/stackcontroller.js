const express = require("express");
const { Gig, User, CallStack } = require("../models");
const { CLIENT_URL, EMAIL_PASSWORD, EMAIL_USER } = process.env;
const router = express.Router();
const nodemailer = require("nodemailer");
const validateSession = require("../middleware/validateSession");
const CallStackModel = require('../helpers/CallStackModel')
//ALL MANIPULATION OF CALLSTACK WILL TAKE PLACE HERE 🐒

const GigModelExample = new CallStackModel(
  false,
  {
    bass: {
      calls: [
        "nick.tucker.bass@gmail.com",
        "jessewittman@gmail.com",
        "brandon@meeks.com",
      ],
      filled: false,
    },
    drums: {
      calls: ["yardebeat@gmail.com", "kennyP842@gmail.com"],
      filled: false,
    },
    guitar: {
      calls: ["joeltuck3@gmail.com", "Sandywilliams@gmail.com"],
      filled: false,
    },
  },
  8
);

console.log(GigModel.returnNext('guitar'))
GigModel.logStack('guitar')


