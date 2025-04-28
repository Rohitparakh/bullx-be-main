"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = realTimeUpdate;
const pumptoken_1 = __importDefault(require("../model/pump/pumptoken"));
const pump_1 = require("../utils/pump");
async function realTimeUpdate() {
    const batchSize = 10; // Define the batch size
    const delayBetweenBatches = 1500; // Delay between processing batches (in milliseconds)
    const delayBetweenRequests = 1500; // Delay between each request (in milliseconds)
    const update = async () => {
        // Fetch tokens from the database in batches
        const totalTokens = await pumptoken_1.default.countDocuments(); // Count total tokens
        const totalBatches = Math.ceil(totalTokens / batchSize); // Determine number of batches
        for (let batch = 0; batch < totalBatches; batch++) {
            // Fetch the current batch of tokens
            const tokens = await pumptoken_1.default.find()
                .sort({ update_at: 1 })
                .limit(batchSize);
            // Process each token in the current batch sequentially with a delay
            for (const token of tokens) {
                try {
                    const mcData = await (0, pump_1.getPumpCurveDataByBondingCurveKey)(token.bonding_curve_key);
                    const updatedToken = await pumptoken_1.default.updateOne({ mint: token.mint }, { ...token.toObject(), mc_data: mcData });
                    console.log("A token updated");
                }
                catch (error) {
                    console.log("Error updating token:", error);
                }
                // Delay between each request to avoid too many requests
                await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
            }
            // Delay between batches to avoid overwhelming the system
            if (batch < totalBatches - 1) {
                console.log(`Waiting ${delayBetweenBatches / 1000} seconds before processing the next batch...`);
                await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
            }
        }
    };
    while (true) { // Continuously run the update function
        await update();
        // Delay before starting the next full update cycle (optional)
        await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute before the next cycle
    }
}
