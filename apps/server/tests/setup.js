process.env.NODE_ENV = "test";
process.env.MONGO_URI = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/vidya_test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-0123456789abcdef0123456789";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-0123456789abcdef012345678";
process.env.CLIENT_URL ||= "http://localhost:5173";
