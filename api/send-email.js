const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body;

  // Input validation
  if (!name || !email || !subject || !message) {
    return res
      .status(400)
      .json({ status: "fail", error: "All fields are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ status: "fail", error: "Invalid email address." });
  }

  // Nodemailer configuration
  const transporter = nodemailer.createTransport({
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

  try {
    // Send mail
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_RECIEVE,
      subject: subject,
      text: message,
    });

    return res
      .status(200)
      .json({ status: "success", message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    return res
      .status(500)
      .json({ status: "fail", error: "Failed to send email." });
  }
};
