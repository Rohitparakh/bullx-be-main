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
exports.default = realTimeUpdate;
const pumptoken_1 = __importDefault(require("../model/pump/pumptoken"));
const pump_1 = require("../utils/pump");
function realTimeUpdate() {
    return __awaiter(this, void 0, void 0, function* () {
        const batchSize = 10; // Define the batch size
        const delayBetweenBatches = 1500; // Delay between processing batches (in milliseconds)
        const delayBetweenRequests = 1500; // Delay between each request (in milliseconds)
        const update = () => __awaiter(this, void 0, void 0, function* () {
            // Fetch tokens from the database in batches
            const totalTokens = yield pumptoken_1.default.countDocuments(); // Count total tokens
            const totalBatches = Math.ceil(totalTokens / batchSize); // Determine number of batches
            for (let batch = 0; batch < totalBatches; batch++) {
                // Fetch the current batch of tokens
                const tokens = yield pumptoken_1.default.find()
                    .sort({ update_at: 1 })
                    .limit(batchSize);
                // Process each token in the current batch sequentially with a delay
                for (const token of tokens) {
                    try {
                        const mcData = yield (0, pump_1.getPumpCurveDataByBondingCurveKey)(token.bonding_curve_key);
                        const updatedToken = yield pumptoken_1.default.updateOne({ mint: token.mint }, Object.assign(Object.assign({}, token.toObject()), { mc_data: mcData }));
                        console.log("A token updated");
                    }
                    catch (error) {
                        console.log("Error updating token:", error);
                    }
                    // Delay between each request to avoid too many requests
                    yield new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
                }
                // Delay between batches to avoid overwhelming the system
                if (batch < totalBatches - 1) {
                    console.log(`Waiting ${delayBetweenBatches / 1000} seconds before processing the next batch...`);
                    yield new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
                }
            }
        });
        while (true) { // Continuously run the update function
            yield update();
            // Delay before starting the next full update cycle (optional)
            yield new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute before the next cycle
        }
    });
}
