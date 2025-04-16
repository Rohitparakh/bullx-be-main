"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordLogin = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
// const allowedOrigins = [
//   "https://conclave-front-end.vercel.app",
//   "https://conclave-front-2vrnfyat4-rohits-projects-73ef6670.vercel.app",
//   "http://localhost:3000",
//   "http://localhost:3001",
// ];
//   const app = express();
//   const server = http.createServer(app);
//   app.use(cors({
//     origin: function (origin, callback) {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error("Not allowed by CORS"));
//         }
//     },
//     methods: "GET, POST, PUT, DELETE",
//     allowedHeaders: "Content-Type, Authorization"
//   }));
//   // ✅ Socket.io Setup with CORS
//   const io = new Server(server, {
//     cors: {
//       origin: function (origin:any, callback:any) {
//         if (!origin || allowedOrigins.includes(origin)) {
//           callback(null, true);
//         } else {
//           callback(new Error("Not allowed by CORS"));
//         }
//       },
//       methods: ["GET","PUT", "POST"],
//     },
//   });
exports.discordLogin = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Discord login router");
}));
// export const discordLogin = expressAsyncHandler(
//   async (req: SocRequest, res: Response, next: NextFunction):Promise<any> => {
//     res.send("Discord callback route is active");
//     const code = req.query.code as string;
//     console.log("client_id:", process.env.DISCORD_CLIENT_ID);
// console.log("client_secret:", process.env.DISCORD_CLIENT_SECRET);
// console.log("code:", code);
// console.log("redirect_uri:", "http://localhost:3002/auth/discord/callback");
//     if (!code) {
//       return res.status(400).send("No code provided");
//     }
//     try {
//       // 1. Exchange code for access token
//       const params = new URLSearchParams();
//       params.append("client_id", process.env.DISCORD_CLIENT_ID || "");
//       params.append("client_secret", process.env.DISCORD_CLIENT_SECRET || "");
//       params.append("grant_type", "authorization_code");
//       params.append("code", code); // Already cast to string
//       params.append("redirect_uri", `${process.env.DISCORD_REDIRECT_URI}`);
//       params.append("scope", "identify email");
//       // Send request to Discord API for the token
//       const tokenResponse = await axios.post(
//         "https://discord.com/api/oauth2/token",
//         params,
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );
//       const { access_token } = tokenResponse.data;
//       // 2. Fetch user information using the access token
//       const userResponse = await axios.get("https://discord.com/api/users/@me", {
//         headers: {
//           Authorization: `Bearer ${access_token}`,
//         },
//       });
//       const discordUser = userResponse.data;
//       console.log("discordUser")
//       console.log(discordUser)
//       const user: UserData | null = await User.findOne({ id: discordUser.id });
//       if (!user) {
//         const newUser = new User({        
//           username: discordUser.username,
//           id: discordUser.id,
//           avatar: discordUser.avatar,
//           email: discordUser.email,          
//           solBalance: 30,
//         });
//         try {
//           const savedUser = await newUser.save();
//           // io.emit("login", {
//           //   user: savedUser,
//           //   pubKey: savedUser.pubKey,
//           //   prvKey: savedUser.prvKey,
//           // });
//           console.log("emit login")
//           console.log(savedUser)
//           console.log("🚀 Emitting 'discordLogin' to all clients");
//           req.io.emit("login", {
//             user: discordUser,
//             id: savedUser.id,
//           });
//         } catch (error) {
//           console.error("Error creating user:", error);
//         }
//       } else {
//         console.log("🚀 Emitting 'discordLogin' to all clients");
//         req.io.emit("login", {
//           user: discordUser,
//           id: user.id,
//         });
//         // io.emit("login", { user, pubKey: user.pubKey, prvKey: user.prvKey });
//       }
//       // Utility to emit socket events
// function sendData(io: any, event: string, payload: any) {
//   console.log(`🔈 Emitting '${event}' with data:`, payload);
//   io.emit(event, payload);
// }
// sendData(req.io, "sendData", {
//   user: discordUser,
//   id: user?.id,
// });
//       // 3. Optional: Save user to DB, set session, JWT etc.
//       // 4. Redirect user to frontend with user info or token
//       res.redirect(
//         `${process.env.FRONTEND_URL}/get-started?user=${encodeURIComponent(
//           JSON.stringify(discordUser)
//         )}`
//       );
//     } catch (err: any) {
//       console.error("Error during Discord OAuth", err?.response?.data || err.message);
//       next(err);  // Forward the error to the next middleware (for proper error handling)
//     }
//   }
// );
