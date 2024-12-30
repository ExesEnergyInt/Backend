const nodemailer = require("nodemailer");
const cors = require("cors");
const { google } = require("googleapis");

// OAuth2 Client setup
const oAuth2Client = new google.auth.OAuth2(
  process.env.Client_ID,
  process.env.Client_Secret,
  process.env.REDIRECT_URI // e.g., 'https://developers.google.com/oauthplayground'
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

      // Create transporter with refreshed token
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.EMAIL_HOST,
          clientId: process.env.Client_ID,
          clientSecret: process.env.Client_Secret,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN,
          accessToken: accessToken.token, // Pass the refreshed access token
        },
      });

      await transporter.verify();

      const mailOptions = {
        from: `"${name}" <${email}>`,
        to: process.env.EMAIL_RECIEVE,
        replyTo: email,
        subject,
        text: message,
        html: `<div>
                <h1>Name: ${name}</h1>
                <p>Email: ${email}</p>
                <p>Subject: ${subject}</p>
                <p>Message: ${message}</p>
                <p><i>Message from Exesenergy Website</i></p>
               </div>`,
      };

      await transporter.sendMail(mailOptions);

      return res
        .status(200)
        .json({ status: "success", message: "Email sent successfully." });
    } catch (error) {
      console.error("Error:", error.message);
      return res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  });
};
