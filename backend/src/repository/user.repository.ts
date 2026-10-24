import type { User } from "../generated/prisma/client";
import type{Db} from "../config/prisma"

export class UserRepository{
    constructor(private readonly db : Db){}

    findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

   async lockById(id: string): Promise<void> {
     await this.db.$queryRaw`SELECT id FROM users WHERE id = ${id} FOR UPDATE`;
  }

  async incrementOrders(id:string) : Promise<void>{
      await this.db.user.update({
        where : {id},
        data : {
            ordersCount : {increment:1}
        }
      })

  }
    async upsert(id: string, name: string, ordersCount: number): Promise<void> {
    await this.db.user.upsert({
      where: { id },
      create: { id, name, ordersCount },
      update: { name, ordersCount },
    });
  }
}



