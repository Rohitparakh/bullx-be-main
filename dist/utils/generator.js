"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachCookie = void 0;
exports.generateRandomNonce = generateRandomNonce;
/**
 * generate random nonce
 * "We use a nonce to make sure your interactions are secure, and it won't cost you anything. It's like an extra lock to keep your online activities safe."
 * @param length
 */
function generateRandomNonce(length = 6) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = nonce.length; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        nonce += characters.charAt(randomIndex);
    }
    return nonce.toUpperCase();
}
const attachCookie = (res, token) => {
    const oneDay = 1000 * 60 * 60 * 24;
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        expires: new Date(Date.now() + oneDay),
    };
    res.cookie('token', token, options);
};
exports.attachCookie = attachCookie;
