import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    console.log(`Attempting to send OTP to ${email}`);
    try {
      const response = await fetch("https://email.vly.ai/send_otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "vlytothemoon2025",
        },
        body: JSON.stringify({
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "Attendance Tracker",
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`Failed to send OTP. Status: ${response.status}. Response: ${responseText}`);
        throw new Error(`Could not send OTP: ${responseText}`);
      }

      console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
      console.error("Error in sendVerificationRequest:", error);
      throw new Error("Failed to send verification email. Please try again later.");
    }
  },
});