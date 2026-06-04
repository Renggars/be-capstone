import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { tokenTypes } from "./tokens.js";
import prisma from "../../prisma/index.js";
import config from "./config.js";

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error("Invalid token type");
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return done(null, false);
    }
    if (!user.isActive) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

export default new JwtStrategy(jwtOptions, jwtVerify);
