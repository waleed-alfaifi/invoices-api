import { loginMiddleware, loginValidators } from "@middleware/login";
import {
  IRegisterRequest,
  registerValidations,
  registerValidator,
} from "@middleware/register";
import { AuthService } from "@services/auth";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

const router = Router();
const authService = AuthService();

/**
 * POST /api/auth/signup
 * POST /api/auth/login
 * GET /api/auth/me
 */

router.post(
  "/signup",
  ...registerValidations,
  registerValidator,
  async (req, res) => {
    const { username, password } = req.body as IRegisterRequest;

    try {
      const result = await authService.registerUser(username, password);
      const token = authService.generateJWT(result.id, result.username);

      return res.status(StatusCodes.CREATED).json({
        token,
        user: result,
      });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
    }
  }
);

router.post("/login", ...loginValidators, loginMiddleware, async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await authService.loginUser(username, password);
    const token = authService.generateJWT(user.id, user.username);

    return res.json({
      token,
      user,
    });
  } catch (error) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      error: error.message,
    });
  }
});

export default router;
