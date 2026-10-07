import jwt from "jsonwebtoken"

try{
    process.loadEnvFile(".env")
}catch (err){
    // .env not in prod
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}

function envStringOrThrow(key : string) : string{
    const value = process.env[key]
    if (!value) throw new Error(`Missing variable ${key} from .env`)
    return value
}

function envNumberOrThrow(key : string) : number{
    const value = Number(envStringOrThrow(key))
    if (Number.isNaN(value)) throw new Error(`${key} is not a number`)
    return value
}

type Config = {
    port : number,
    dbUrl : string,
    jwtSecret : string,
    jwtSecretExpiresIn : jwt.SignOptions["expiresIn"]
}

export const config : Config = {
    port : envNumberOrThrow('PORT'),
    dbUrl : envStringOrThrow('DATABASE_URL'),
    jwtSecret : envStringOrThrow('JWT_SECRET'),
    jwtSecretExpiresIn : envStringOrThrow('JWT_SECRET_EXPIRES_IN') as jwt.SignOptions["expiresIn"]
}