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
const http_1 = __importDefault(require("http"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const web3_js_1 = __importDefault(require("@solana/web3.js"));
const bs58_1 = __importDefault(require("bs58"));
dotenv_1.default.config();
const user_router_1 = __importDefault(require("./routes/user.router"));
const trade_router_1 = __importDefault(require("./routes/trade.router"));
const user_1 = __importDefault(require("./model/user"));
const pump_router_1 = __importDefault(require("./routes/pump.router"));
const PORT = process.env.PORT || 5005;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)());
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({ origin: "*" }));
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use("/pumpfun", pump_router_1.default);
app.get("/health-check", (req, res) => {
    res.status(200).json({
        message: "Server is healthy!",
    });
});
app.use("/user", user_router_1.default);
app.use("/", trade_router_1.default);
io.on("connection", (socket) => {
    socket.on("sendData", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, userName, code } = data;
        const user = yield user_1.default.findOne({ userId: userId });
        if (!user) {
            const keyPair = web3_js_1.default.Keypair.generate();
            const newUser = new user_1.default({
                userName: userName,
                userId: userId,
                pubKey: bs58_1.default.encode(keyPair.publicKey.toBuffer()),
                prvKey: bs58_1.default.encode(keyPair.secretKey),
                solBalance: 30,
            });
            try {
                const savedUser = yield newUser.save();
                io.emit("login", {
                    code: code,
                    user: savedUser,
                    pubKey: bs58_1.default.encode(keyPair.publicKey.toBuffer()),
                    prvKey: bs58_1.default.encode(keyPair.secretKey),
                });
            }
            catch (error) {
                console.error("Error creating user:", error);
            }
        }
        else {
            io.emit("login", {
                code: code,
                user,
                pubKey: user.pubKey,
                prvKey: user.prvKey,
            });
            console.log("send prvKey");
        }
        //io.emit("login", { code: code, prvKey: "eedfgetf" });
    }));
});
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Connected to the database! ❤️");
    server.listen(PORT);
    console.log("Server listening on:", PORT);
    // subscribeToCreateToken();
}))
    .catch((err) => {
    console.log("Cannot connect to the database! 😭", err);
    process.exit();
});
