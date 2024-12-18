const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_HOST,
    pass: process.env.HOST_PASSWORD,
    clientId: process.env.Client_ID,
    clientSecret: process.env.Client_Secret,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
});

// Verify transporter
transporter.verify((err, success) => {
  if (err) {
    console.error("Transporter verification failed:", err);
  } else {
    console.log("=== Server is ready to take messages ===");
  }
});

// Route to send emails
app.post("/api/send-email", (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res
      .status(400)
      .json({ status: "fail", error: "All fields are required." });
  }

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_RECIEVE,
    subject: `Message from ${name} (${email}): ${subject}`,
    text: message,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error("Error sending email:", err);
      return res
        .status(500)
        .json({ status: "fail", error: "Failed to send email." });
    }

    console.log("== Message Sent ==");
    res
      .status(200)
      .json({ status: "success", message: "Email sent successfully." });
  });
});


const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
