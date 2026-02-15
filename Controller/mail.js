import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS; 


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  secure: false, 
  port: 587, 
});


export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `Food4All App <${EMAIL_USER}>`, 
      to: to,  
      subject: subject, 
      text: text, 
      html: html, 
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Message sent successfully: ${info.messageId}`);

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Failed to send email.");
  }
};

export default sendEmail;