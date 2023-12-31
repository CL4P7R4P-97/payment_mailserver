require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const serverless = require('serverless-http');

const app = express();
const router = express.Router();
const corsOptions = {
  origin: 'https://peaceful-pie-f1123f.netlify.app',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
 
app.use(express.json());
 
 

router.get("/", (req, res) => {
  res.send("Welcome to eShop website.");
});

const array = [];
const calculateOrderAmount = (items) => {
  items.map((item) => {
    const { price, quantity } = item;
    const cartItemAmount = price * quantity;
    return array.push(cartItemAmount);
  });
  const totalAmount = array.reduce((a, b) => {
    return a + b;
  }, 0);

  return totalAmount * 100;
};

router.use(bodyParser.json());

app.use(cors(corsOptions));

router.post('/sendOrderEmail', (req, res) => {

  console.log("sending mail")
  const { to, subject, body } = req.body;
  console.log(body, to, subject);
  var transporter = nodemailer.createTransport({
    service: "gmail",
     
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
  });

  const mailOptions = {
    from: 'reactShop.com',
    to,
    subject,
    html: body,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Email sent: ' + info.response);
  });
});

app.use(cors(corsOptions));

router.post("/create-payment-intent", async (req, res) => {
  const { items, shipping, description } = req.body;

  // Create a PaymentIntent with the order amount and currency..
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "inr",
    automatic_payment_methods: {
      enabled: true,
    },
    description,
    shipping: {
      address: {
        line1: shipping.line1,
        line2: shipping.line2,
        city: shipping.city,
        country: shipping.country,
        postal_code: shipping.postal_code,
      },
      name: shipping.name,
      phone: shipping.phone,
    },
    // receipt_email: customerEmail
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.use('/.netlify/functions/api',router);
module.exports.handler = serverless(app);