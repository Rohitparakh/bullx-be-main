"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBalance = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_1 = __importDefault(require("../model/user"));
// export const userRegist = expressAsyncHandler(
//     async (req: SocRequest, res: Response) => {
//         const { prvKey, code } = req.body;
//         const user = await User.findOne({ prvKey: prvKey });
//         if (!user) {
//             const keyPair = solanaWeb3.Keypair.generate();
//             console.log("keyPair", keyPair);
//             console.log("raw:", keyPair.publicKey);
//             console.log("buffer:", keyPair.publicKey.toBuffer())
//             const newUser = new User({
//                 username: "Username",
//                 userId: 0,
//                 pubKey: bs58.encode(keyPair.publicKey.toBuffer()),
//                 prvKey: bs58.encode(keyPair.secretKey),
//                 solBalance: 50
//             });
//             try {
//                 const savedUser = await newUser.save();
//                 console.log('User saved:', savedUser);
//             } catch (error) {
//                 console.error('Error creating user:', error);
//             }
//             res.json({ success: true, message: "user saved" })
//             const io = req.io;
//             io.on("connection", (socket: Socket) => {
//                 socket.join(code);
//                 io.to(code).emit("login", { prvKey: bs58.encode(keyPair.secretKey) })
//             })
//         } else {
//             res.json({ success: true, message: "user exist" })
//             const io = req.io;
//             io.on("connection", (socket: Socket) => {
//                 console.log("user connected:", socket.id)
//                 socket.join(code);
//                 io.to(code).emit("login", { id:user.id })
//             })
//             console.log("send prvKey")
//         }
//     }
// )
exports.setBalance = (0, express_async_handler_1.default)(async (req, res) => {
    console.log("Balance API Hit"); // Check if this logs
    const { id, newBalance } = req.body;
    const user = await user_1.default.findOne({ id: id });
    if (!user) {
        res.status(500).json({ success: false, message: "user doesn't exist" });
    }
    else {
        // Update the user's balance
        user.solBalance = newBalance;
        await user.save();
        res.status(200).json({ success: true, message: "Balance updated successfully" });
        console.log("Updated balance for user");
    }
});
// export const setBalance = expressAsyncHandler(
//     async (req: SocRequest, res: Response) => {
//         const { prvKey, newBalance } = req.body;
//         const user = await User.findOne({ prvKey: prvKey });
//         if (!user) {
//             res.json({ success : false, message : "user doesn't exist"})
//         } else {
//             res.json({ success: true, message: "user exist" })
//             console.log("send prvKey")
//         }
//     }
// )
