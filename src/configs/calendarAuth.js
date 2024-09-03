import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

// Function to set credentials with tokens and update the OAuth2Client
const setCredentials = (tokens) => {
  oAuth2Client.setCredentials(tokens);
};

// Criação do cliente OAuth2
export const oAuth2Client = new google.auth.OAuth2({
  clientId: process.env.FIREBASE_CLIENT_ID,
  clientSecret: process.env.FIREBASE_CLIENT_SECRET,
  redirectUri: process.env.FIREBASE_REDIRECT_URI,
});

// Function to refresh the access token
export const refreshAccessToken = async () => {
  try {
    await oAuth2Client.refreshAccessToken();
    console.log("Token atualizado com sucesso!");
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

// Check if there are stored tokens (refresh token) and set credentials
if (process.env.GOOGLE_REFRESH_TOKEN) {
  setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

// Gere a URL de autorização
export const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
});
