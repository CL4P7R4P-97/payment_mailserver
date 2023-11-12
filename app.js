require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
 

const app = express();
app.use(cors());
app.use(express.json());
const path = require("path");

if (process.env.NODE_ENV === "production") {
  app.use(express.static("build"));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "build", "index.html"));
  });
}

app.get("/", (req, res) => {
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

app.use(bodyParser.json());

app.post('/sendOrderEmail', (req, res) => {

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

app.post("/create-payment-intent", async (req, res) => {
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

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}`));
