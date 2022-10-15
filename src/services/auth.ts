import jwt from "jsonwebtoken";
import { prismaClient } from "@shared/index";
import bcrypt from "bcrypt";
import { jwtSecret } from "@shared/index";

class AuthServiceClass {
  private model = prismaClient.user;
  public static singleton: AuthServiceClass | undefined;

  async registerUser(username: string, password: string) {
    const userExists = await this.model.findFirst({
      where: {
        username,
      },
    });

    if (userExists) {
      throw new Error("User is already registered");
    }

    const hashedPassword = await this.getHashed(password);
    if (!hashedPassword) throw new Error("Error while registering user");

    const newUser = {
      username,
      password: hashedPassword,
    };

    const createdUser = await this.model.create({
      data: newUser,
      select: {
        id: true,
        username: true,
      },
    });

    return createdUser;
  }

  async loginUser(username: string, password: string) {
    const user = await this.model.findFirst({
      where: {
        username,
      },
      select: {
        id: true,
        username: true,
        password: true,
      },
    });

    if (!user) {
      throw new Error("Username or password is wrong");
    }

    const isPasswordCorrect = await this.comparePassword(
      user.password,
      password
    );

    if (!isPasswordCorrect) {
      throw new Error("Username or password is wrong");
    }

    return {
      id: user.id,
      username: user.username,
    };
  }

  async getUser(id: string) {
    return await this.model.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        username: true,
      },
    });
  }

  private async getHashed(password: string): Promise<string | undefined> {
    try {
      const saltRounds = 10;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error(error);
    }
  }

  private async comparePassword(hashed: string, plain: string) {
    return await bcrypt.compare(plain, hashed);
  }

  generateJWT(id: string, username: string) {
    const payload = {
      id,
      username,
    };

    return jwt.sign(payload, jwtSecret, {
      expiresIn: "30 days",
    });
  }
}

export const AuthService = () => {
  if (AuthServiceClass.singleton) {
    return AuthServiceClass.singleton;
  }

  const instance = new AuthServiceClass();
  AuthServiceClass.singleton = instance;
  return instance;
};
