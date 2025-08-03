import { Request, Response, NextFunction } from "express";
export declare function verifyFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void>;
