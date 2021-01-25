import jwt = require('jsonwebtoken');
import { TokenData } from '../interfaces/TokenData';
import { TokenPayload } from '../interfaces/TokenPayload';

export function verifyToken(token: string): TokenPayload {
    try {
        const secret = process.env.JWT_SECRET || "";
        return jwt.verify(token, secret) as TokenPayload;
    } catch (err) {
      throw `Token could not be verified due to error: ${err}`;
    }
}

export function createToken(payload: TokenPayload): TokenData {
  const expiresIn = 60 * 60; // an hour
  const secret = process.env.JWT_SECRET || "";
  return {
    expiresIn,
    token: jwt.sign(payload, secret, { expiresIn }),
  };
}