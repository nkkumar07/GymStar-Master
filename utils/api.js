// utils/api.js

// const LOCAL_API = "http://127.0.0.1:8000";
// const LIVE_API = "https://gymstar-api-main.onrender.com"; // Replace this when live

// Toggle between local and live
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// console.log("NODE_ENV is", process.env.NODE_ENV);

//   process.env.NODE_ENV === "development" ? LOCAL_API : LIVE_API;
