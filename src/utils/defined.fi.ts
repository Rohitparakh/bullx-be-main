import axios from "axios";
import { jwtTokenCache } from "./graphql";
import { createHash } from "crypto";

const fetchKeyApi = async (challenge: string) => {
  try {
    const response = await axios.get(
      `https://d2gndqco47nwa6.cloudfront.net?challenge=${encodeURIComponent(
        challenge
      )}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch key:", error);
    return null;
  }
};

const getJwtToken = async () => {
  if (
    jwtTokenCache.jwtToken &&
    Date.now() - jwtTokenCache.updatedAt < jwtTokenCache.updateTimer
  ) {
    return jwtTokenCache.jwtToken;
  }
  const challenge = createHash("sha256")
    .update(
      (
        Math.floor(Date.now() / 1e3) -
        (Math.floor(Date.now() / 1e3) % 300)
      ).toString()
    )
    .digest("base64");
  try {
    const fetchedKey = await fetchKeyApi(challenge);
    if (!fetchedKey || fetchedKey.includes("Failed challenge")) {
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      return await getJwtToken();
    }
    jwtTokenCache.jwtToken = fetchedKey;
  } catch (error) {}
  jwtTokenCache.updatedAt = Date.now();
  console.log("🚀 ~ fetched ~ token for defined.fi");
  return jwtTokenCache.jwtToken;
};
