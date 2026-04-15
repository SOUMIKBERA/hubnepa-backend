const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"HubNepa" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };
  return await transporter.sendMail(mailOptions);
};

const resetPasswordTemplate = (resetUrl) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
    <h2 style="color:#1a1a1a;">Reset Your HubNepa Password</h2>
    <p>You requested a password reset. Click the button below to reset your password. This link expires in 1 hour.</p>
    <a href="${resetUrl}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Reset Password</a>
    <p style="color:#666;font-size:12px;">If you didn't request this, please ignore this email.</p>
  </div>
`;

module.exports = { sendEmail, resetPasswordTemplate };