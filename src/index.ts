import { Request, Response, NextFunction } from "express";
import http from "http";
import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Server, Socket } from "socket.io";
import solanaWeb3 from "@solana/web3.js";
import bs58 from "bs58";

dotenv.config();

import userRouter from "./routes/user.router";
import tradeRouter from "./routes/trade.router";
import truncateRouter from "./routes/truncate.router";
import User, { UserData } from "./model/user";
import pumpRouter from "./routes/pump.router";
import expressAsyncHandler from "express-async-handler";

interface SocRequest extends Request {
  io?: any;
}

const PORT: string | number = process.env.PORT || 3002;

const app = express();
const server = http.createServer(app);

// ✅ CORS Configuration: Allow All Origins
// app.use(
//   cors({
//     origin: "*", // Allows all origins
//     methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
//   })
// );
app.use(cors()); // Allow all origins

const allowedOrigins = [
  "https://conclave-front-end.vercel.app",
  "https://conclave-front-2vrnfyat4-rohits-projects-73ef6670.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
      } else {
          callback(new Error("Not allowed by CORS"));
      }
  },
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization"
}));


// ✅ Middleware to set CORS Headers (Extra Protection)
app.use((req: SocRequest, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  req.io = io;
  next();
});

// ✅ Socket.io Setup with CORS
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET","PUT", "POST"],
  },
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/pumpfun", pumpRouter);
app.use("/truncate", truncateRouter);

app.get("/health-check", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is healthy!" });
});

app.use("/user", userRouter);
app.use("/", tradeRouter);

io.on("connection", (socket: Socket) => {
  socket.on("sendData", async (data) => {
    const { clientId } = data;
    const user: UserData | null = await User.findOne({ pubKey: clientId });

    if (!user) {
      const keyPair = solanaWeb3.Keypair.generate();
      const newUser = new User({
        username: "Username",
        userId: 0,
        pubKey: bs58.encode(keyPair.publicKey.toBuffer()),
        prvKey: bs58.encode(keyPair.secretKey),
        solBalance: 30,
      });

      try {
        const savedUser = await newUser.save();
        io.emit("login", {
          user: savedUser,
          pubKey: savedUser.pubKey,
          prvKey: savedUser.prvKey,
        });
      } catch (error) {
        console.error("Error creating user:", error);
      }
    } else {
      io.emit("login", { user, pubKey: user.pubKey, prvKey: user.prvKey });
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("Available routes:");
app._router.stack.forEach((r:any) => {
    if (r.route && r.route.path) {
        console.log(r.route.path);
    }
});

    console.log("Connected to the database! ❤️");
    // console.log("Solscan API Key:", process.env.SOLSCAN_API_KEY);

console.log("🔍 Checking Environment Variables:");

const envVars = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  RPC_ENDPOINT: process.env.RPC_ENDPOINT,
  METADATA_URL: process.env.METADATA_URL,
  OHLC_BASE_URL: process.env.OHLC_BASE_URL,
  SOL_PRICE_URL: process.env.SOL_PRICE_URL,
  CMC_API_KEY: process.env.CMC_API_KEY,
  LATEST_TRADE_URL: process.env.LATEST_TRADE_URL,
  LATEST_COIN_URL: process.env.LATEST_COIN_URL,
  THREAD_URL: process.env.THREAD_URL,
  TRANSCATION_URL: process.env.TRANSCATION_URL,
  TOKEN_DATA_URL: process.env.TOKEN_DATA_URL,
  BITQUERY_API_KEY: process.env.BITQUERY_API_KEY,
  HELIUS_RPC: process.env.HELIUS_RPC,
  BITQUERY_TOKEN: process.env.BITQUERY_TOKEN,
  BITQUERY_CLIENT_ID: process.env.BITQUERY_CLIENT_ID,
  BITQUERY_CLIENT_SECRET: process.env.BITQUERY_CLIENT_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  PUMPPORTAL_WS_ENDPOINT: process.env.PUMPPORTAL_WS_ENDPOINT,
  SOLSCAN_TOKEN: process.env.SOLSCAN_TOKEN,
};

// Hide sensitive values (optional)
const safeEnvVars = Object.fromEntries(
  Object.entries(envVars).map(([key, value]) => [key, value ? "Exists ✅" : "Missing ❌"])
);

console.log(safeEnvVars);
console.log("All ENV Variables:");
console.log(process.env);

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT} 🚀`);
    });
  })
  .catch((err) => {
    console.error("Cannot connect to the database! 😭", err);
    process.exit(1);
  });


  // import { Request, Response, NextFunction } from "express";
// import http from "http";
// import bodyParser from "body-parser";
// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { Server, Socket } from "socket.io";
// import solanaWeb3 from "@solana/web3.js";
// import bs58 from "bs58";
// dotenv.config();

// import userRouter from "./routes/user.router";
// import tradeRouter from "./routes/trade.router";
// import truncateRouter from "./routes/truncate.router";
// import User, { UserData } from "./model/user";
// import pumpRouter from "./routes/pump.router";
// import expressAsyncHandler from "express-async-handler";
// // import { subscribeToCreateToken } from "./services/bitquery";

// interface SocRequest extends Request {
//   io?: any;
// }

// const PORT: string | number = process.env.PORT || 3000;

// const app = express();
// const server = http.createServer(app);
// app.use(cors());

// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT","DELETE"],
//   },
// });

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cors({ origin: "*" }));
// app.use((req: SocRequest, res: Response, next: NextFunction) => {
//   req.io = io;
//   next();
// });

// app.use("/pumpfun", pumpRouter);


// app.use("/truncate", truncateRouter)


// app.get("/health-check", (req: Request, res: Response) => {
//   res.status(200).json({
//     message: "Server is healthy!",
//   });
// });

// app.use("/user", userRouter);
// app.use("/", tradeRouter);

// io.on("connection", (socket: Socket) => {
//   socket.on("sendData", async (data) => {
//     // const { userId, userName, code } = data;
//     const { clientId } = data;

//     const user: UserData | null = await User.findOne({ pubKey: clientId });
//     if (!user) {
//       const keyPair = solanaWeb3.Keypair.generate();

//       const newUser = new User({
//         // userName: userName || "test",
//         // userId: userId || '123',
//         pubKey: bs58.encode(keyPair.publicKey.toBuffer()),
//         prvKey: bs58.encode(keyPair.secretKey),
//         solBalance: 30,
//       });
//       try {
//         const savedUser = await newUser.save();
//         io.emit("login", {
//           // code: code,
//           user: savedUser,
//           pubKey: bs58.encode(keyPair.publicKey.toBuffer()),
//           prvKey: bs58.encode(keyPair.secretKey),
//         });
//       } catch (error) {
//         console.error("Error creating user:", error);
//       }
//     } else {
//       io.emit("login", {
//         // code: code,
//         user,
//         pubKey: user.pubKey,
//         prvKey: user.prvKey,
//       });
//       console.log("send prvKey");
//     }
//     //io.emit("login", { code: code, prvKey: "eedfgetf" });
//   });
// });

// mongoose
//   .connect(process.env.MONGO_URI as string)
//   .then(async () => {
//     console.log("Connected to the database! ❤️");
//     server.listen(PORT);
//     console.log("Server listening on:", PORT);
//     console.log("Solscan API Key:", process.env.SOLSCAN_API_KEY);

//     // subscribeToCreateToken();
//   })
//   .catch((err) => {
//     console.log("Cannot connect to the database! 😭", err);
//     process.exit();
//   });
