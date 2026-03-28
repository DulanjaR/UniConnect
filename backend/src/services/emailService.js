import nodemailer from 'nodemailer';

// Create transporter using Gmail or your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate random 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp, name = 'Student') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'UniConnect Registration - Email Verification OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { color: #0e7c7b; font-size: 24px; margin-bottom: 20px; font-weight: bold; }
            .content { color: #333; line-height: 1.6; }
            .otp-box { background: #f0f8f7; border: 2px solid #0e7c7b; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #0e7c7b; letter-spacing: 5px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Welcome to UniConnect!</div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for registering with UniConnect. To complete your email verification, please use the following One-Time Password (OTP):</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for 10 minutes only</li>
                <li>Never share this code with anyone</li>
                <li>UniConnect staff will never ask for your OTP</li>
              </ul>
              
              <p>If you didn't request this OTP, please ignore this email or contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 UniConnect. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send welcome email after successful registration
export const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to UniConnect!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { color: #0e7c7b; font-size: 24px; margin-bottom: 20px; font-weight: bold; }
            .content { color: #333; line-height: 1.6; }
            .button { display: inline-block; background: #0e7c7b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Welcome to UniConnect, ${name}!</div>
            <div class="content">
              <p>Your account has been successfully created and verified. Start connecting with your peers today!</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Go to UniConnect</a>
              <p>UniConnect is your dedicated student network platform where you can:</p>
              <ul>
                <li>Join study groups with your batch mates</li>
                <li>Share knowledge and resources</li>
                <li>Find lost and found items</li>
                <li>Connect with students in your academic circle</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2024 UniConnect. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};
