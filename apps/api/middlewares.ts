import type { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import { JWT_PUBLIC_KEY } from "./config";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers['authorization'];
        if (!token) {
                res.status(401).json({
                        message: "Not Authenticated!"
                })
                return;
        }
        try {
                const decoded = jwt.verify(token, JWT_PUBLIC_KEY);
                console.log('user', decoded)
                // req.userId = decoded.sub as string;
                req.userId = "1"
                next();
        } catch (error) {
                if (error instanceof JsonWebTokenError)
                        console.log(error.message)
        }
}