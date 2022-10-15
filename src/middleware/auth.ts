import passport from "passport";
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
import { jwtSecret } from "@shared/index";
import { AuthService } from "@services/auth";
import { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

const authService = AuthService();

export const authStrategy = () =>
  new JWTStrategy(
    {
      secretOrKey: jwtSecret,
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
    },
    async (payload, done) => {
      try {
        const { id } = payload;
        const user = await authService.getUser(id);

        if (user) {
          return done(null, user);
        }

        return done("Unauthorized", null);
      } catch (error) {
        done("Server error", null);
      }
    }
  );

export const authenticated: RequestHandler = (req, res, next) => {
  return passport.authenticate(
    "jwt",
    { session: true },
    (error, user, info) => {
      // Our custom error
      if (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          error,
        });
      }

      // JWT Strategy internal error
      if (info) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: info.message,
        });
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};
