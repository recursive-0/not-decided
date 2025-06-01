import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema"
import { Env } from "../../worker-configuration";


export type DB = ReturnType<typeof drizzle<typeof schema>>

export function createDB(env: Env){
    return drizzle(env.DB_DEV, {schema})
}