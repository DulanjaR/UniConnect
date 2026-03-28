import './src/config/env.js';
import { sendOTPEmail, generateOTP } from './src/services/emailService.js';

const testEmail = async () => {
  try {
    console.log('Testing email configuration...');
    console.log('Email User:', process.env.EMAIL_USER);
    
    const testOTP = generateOTP();
    console.log('Generated test OTP:', testOTP);
    
    await sendOTPEmail('test@example.com', testOTP, 'Test User');
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
  process.exit(0);
};

testEmail();
