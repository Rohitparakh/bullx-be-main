import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import expressAsyncHandler from "express-async-handler";

// Define your custom request type (SocRequest)
interface SocRequest extends Request {
  query: {
    code: string | undefined; // Code is optional, but if present, it will be a string
  };
}

export const discordLogin = expressAsyncHandler(
  async (req: SocRequest, res: Response, next: NextFunction):Promise<any> => {
    const code = req.query.code as string;
    console.log("client_id:", process.env.DISCORD_CLIENT_ID);
console.log("client_secret:", process.env.DISCORD_CLIENT_SECRET);
console.log("code:", code);
console.log("redirect_uri:", "http://localhost:3002/auth/discord/callback");

    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      // 1. Exchange code for access token
      const params = new URLSearchParams();
      params.append("client_id", process.env.DISCORD_CLIENT_ID || "");
      params.append("client_secret", process.env.DISCORD_CLIENT_SECRET || "");
      params.append("grant_type", "authorization_code");
      params.append("code", code); // Already cast to string
      params.append("redirect_uri", "http://localhost:3002/auth/discord/callback");
      params.append("scope", "identify email");

      // Send request to Discord API for the token
      const tokenResponse = await axios.post(
        "https://discord.com/api/oauth2/token",
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token } = tokenResponse.data;

      // 2. Fetch user information using the access token
      const userResponse = await axios.get("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const discordUser = userResponse.data;
      console.log("discordUser")
      console.log(discordUser)

      // 3. Optional: Save user to DB, set session, JWT etc.

      // 4. Redirect user to frontend with user info or token
      res.redirect(
        `http://localhost:3000/dashboard?user=${encodeURIComponent(
          JSON.stringify(discordUser)
        )}`
      );
    } catch (err: any) {
      console.error("Error during Discord OAuth", err?.response?.data || err.message);
      next(err);  // Forward the error to the next middleware (for proper error handling)
    }
  }
);
