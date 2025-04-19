import jwt from "jsonwebtoken";

const verifySocketJWT = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication token missing"));

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Token invalid"));
    socket.user = user;
    next();
  });
};

export default verifySocketJWT;
