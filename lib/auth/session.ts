import { NextRequest } from "next/server";
import { verifyToken, TokenPayload } from "./jwt";

const COOKIE_NAME = "session-token";

export function getSessionFromRequest(req: NextRequest): TokenPayload | null {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if(!token) {
        return null;
    }

    return verifyToken(token);
}

export {COOKIE_NAME};