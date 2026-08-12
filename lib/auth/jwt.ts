import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if(!JWT_SECRET) {
    throw new Error("JWT secret is not set in env");
}

const TOKEN_EXPIRY = "7d";

export interface TokenPayload {
    userId: string,
    email: string
}

export function signToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET as string, {expiresIn: TOKEN_EXPIRY});
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
    } catch (error) {
        return null;
    }
}