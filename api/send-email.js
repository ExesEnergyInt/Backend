require("dotenv").config();
const nodemailer = require("nodemailer");
const cors = require("cors");
const { google } = require("googleapis");

// OAuth2 Client setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Set the refresh token
oAuth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

const corsMiddleware = cors({ origin: "*", methods: ["POST"] });

module.exports = async (req, res) => {
  corsMiddleware(req, res, async () => {
    if (req.method === "OPTIONS") {
      return res.status(200).send("Preflight OK");
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { name, email, subject, message } = req.body;

      // Validate input
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required." });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address." });
      }

      // Get a new access token
      const accessToken = await oAuth2Client.getAccessToken();
      if (!accessToken || !accessToken.token) {
        throw new Error("Failed to retrieve access token.");
      }
      console.log("Access token retrieved successfully.");

      // Set up nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL_HOST,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN,
          accessToken: accessToken.token,
        },
        debug: true, // Enable debugging
        logger: true, // Enable logging
      });

      // Verify SMTP transporter
      await transporter.verify();
      console.log("SMTP server is ready to send emails.");

      // Mail options
      const mailOptions = {
        from: `"${name}" <${email}>`,
        to: process.env.EMAIL_RECEIVE,
        replyTo: email,
        subject,
        html: `
          <h1>Name: ${name}</h1>
          <p>Email: ${email}</p>
          <p>Subject: ${subject}</p>
          <p>Message: ${message}</p>
          <p><i>Message from Exesenergy Website</i></p>
        `,
      };
      console.log("Mail options:", mailOptions);

      // Send email
      await transporter.sendMail(mailOptions);
      console.log("Email sent successfully.");

      return res
        .status(200)
        .json({ status: "success", message: "Email sent successfully." });
    } catch (error) {
      console.error("Error details:", error);
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });
};
