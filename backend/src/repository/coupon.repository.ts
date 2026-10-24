import type {Coupon, User} from "@prisma/client"
import type{Db} from "../config/prisma"

export class CouponRepository{
    constructor(private readonly db:Db){}

    async findByCodes(codes : string[]):Promise<Map<string , Coupon>>{
        const rows = await this.db.coupon.findMany({
              where : {code : {in : codes}}
        })
        return new Map(rows.map((row)=> [row.code , row]));
    }

    async findRedemptions(userId : string , codes:string[]):Promise<Record<string ,number>>{
         const rows = await this.db.couponRedemption.findMany({
            where : {userId , couponCode : {in : codes}}
         })
         return Object.fromEntries(rows.map((r) => [r.couponCode , r.count]))
    } 

    async consumeOne(code : string) : Promise<Boolean>{
        const updated = await this.db.$executeRaw`
        UPDATE coupons 
        SET used_count = used_count + 1
        WHERE code = ${code} 
          AND(usage_limit IS NULL OR used_count < usage_limit)
        `
        return updated === 1;
    }

    async incrementRedemption(userId : string , couponCode:string) : Promise<void>{
         await this.db.couponRedemption.upsert({
            where : {userId_couponCode : {userId , couponCode}},
            create : {userId , couponCode , count : 1},
            update : {count : {increment :1}}
         })
        }

    async upsert (row : Coupon):Promise<void>{
    const { code, ...data } = row;
    await this.db.coupon.upsert({ where: { code }, create: row, update: data });
    }
}
