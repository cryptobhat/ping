import axios from 'axios';

const AUTH_TOKEN = process.env.MESSAGECENTRAL_API_KEY || '';
const BASE_URL = process.env.MESSAGECENTRAL_API_URL || 'https://cpaas.messagecentral.com';

// Extract customerId from JWT token
let CUSTOMER_ID = process.env.MESSAGECENTRAL_CUSTOMER_ID || '';
if (!CUSTOMER_ID && AUTH_TOKEN) {
  try {
    const payload = JSON.parse(Buffer.from(AUTH_TOKEN.split('.')[1], 'base64').toString());
    CUSTOMER_ID = payload.sub || '';
  } catch {}
}

function friendlyOtpError(raw: string): string {
  const upper = raw.toUpperCase();
  if (upper.includes('WRONG_OTP') || upper.includes('INVALID_OTP')) return 'Wrong OTP. Please check and try again.';
  if (upper.includes('EXPIRED') || upper.includes('TIMED_OUT')) return 'OTP has expired. Please request a new one.';
  if (upper.includes('ALREADY_VERIFIED')) return 'OTP already used. Please request a new one.';
  if (upper.includes('MAX_ATTEMPT') || upper.includes('BLOCKED')) return 'Too many attempts. Please request a new OTP.';
  return raw;
}

export const messageCentralService = {
  async sendOtp(phone: string): Promise<{ success: boolean; verificationId?: string; error?: string }> {
    // Dev mode — skip MSG Central, use local OTP
    if (!AUTH_TOKEN || process.env.NODE_ENV === 'development') {
      return { success: true, verificationId: 'dev-mode' };
    }

    try {
      const formatted = phone.replace(/[\s+\-()]/g, '');
      const mobileNumber = formatted.startsWith('91') && formatted.length > 10 ? formatted.slice(2) : formatted;

      const response = await axios.post(`${BASE_URL}/verification/v3/send`, null, {
        params: {
          countryCode: '91',
          customerId: CUSTOMER_ID,
          flowType: 'SMS',
          mobileNumber,
          otpLength: 6,
        },
        headers: { authToken: AUTH_TOKEN },
        timeout: 10000,
      });

      if (response.data.responseCode === 200 && response.data.data?.verificationId) {
        console.log(`[MSG Central] OTP sent to ***${mobileNumber.slice(-4)}`);
        return { success: true, verificationId: response.data.data.verificationId };
      }

      return { success: false, error: response.data.message || 'Failed to send OTP' };
    } catch (error: any) {
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        return { success: false, error: 'SMS service timed out. Please try again.' };
      }
      return { success: false, error: error?.response?.data?.message ?? error?.message ?? 'Failed to send OTP' };
    }
  },

  async validateOtp(verificationId: string, otp: string): Promise<{ success: boolean; error?: string }> {
    // Dev mode — accept any OTP stored locally
    if (!AUTH_TOKEN || process.env.NODE_ENV === 'development' || verificationId === 'dev-mode') {
      return { success: true };
    }

    try {
      const response = await axios.get(`${BASE_URL}/verification/v3/validateOtp`, {
        params: { verificationId, code: otp },
        headers: { authToken: AUTH_TOKEN },
        timeout: 10000,
      });

      if (response.data.responseCode === 200 && response.data.data?.verificationStatus === 'VERIFICATION_COMPLETED') {
        return { success: true };
      }

      const rawMsg = response.data.message || response.data.data?.verificationStatus || 'OTP verification failed';
      return { success: false, error: friendlyOtpError(rawMsg) };
    } catch (error: any) {
      const status = error?.response?.data?.responseCode;
      if (status === 702) return { success: false, error: 'Wrong OTP. Please try again.' };
      if (status === 705) return { success: false, error: 'OTP expired. Please request a new one.' };
      return { success: false, error: friendlyOtpError(error?.response?.data?.message ?? 'OTP verification failed') };
    }
  },
};
