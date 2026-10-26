    # Medex Checkout Calculator

    A checkout calculator for a healthcare marketplace that allows users to add services to their cart and apply up to two coupon codes per order.

    The backend validates each coupon, checks its eligibility, and calculates the applicable discounts. It then calculates the 7% VAT and returns a detailed price breakdown, including the subtotal, discounts, VAT, and final amount payable.

    ## Project structure
    - `backend/`: Express, TypeScript, Prisma, PostgreSQL
    - `frontend/`: React, Vite, TypeScript, Tailwind CSS
    - `checkout.json`: fictional services, customers, coupons and examples

    ## Running Locally

    **Requirements:** Node.js 20.19+ or 22.12+, PostgreSQL 16, and npm.

    ### 1. Create the Database

    Using `psql` or pgAdmin, connect to your PostgreSQL server and run:

    ```sql
    CREATE DATABASE medex;
    ```

    ### 2. Configure the Environment

    Create or update `backend/.env` with your local PostgreSQL connection details:

    ```env
    DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/medex?schema=public"
    PORT=4000
    ```

    Replace `YOUR_PASSWORD` with your PostgreSQL password. The default PostgreSQL port is `5432`. Change it if your installation uses a different port.

    ### 3. Start the Backend

    Open a terminal and run:

    ```bash
    cd backend
    npm install
    npx prisma migrate dev
    npx prisma generate
    npm run db:seed
    npm run dev
    ```

    The backend API will be available at `http://localhost:4000/api`.

    ### 4. Start the Frontend

    Open a **second terminal** and run:

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

    The frontend will be available at `http://localhost:5173`.

    ### 5. Run the Tests

    From the `backend/` directory, run:

    ```bash
    npm test
    ```

## Design Choices

**Layered backend.** Routes call controllers, controllers call services, services call repositories, and repositories talk to Prisma. Each layer has one job, so the rules can be changed without touching the database code.

**Pure calculation engine.** `src/engine/calculate.ts` takes plain data and returns plain data. It never reads the database. This makes the spec's rules easy to test, and the same function runs for both quotes and orders.

**Quote is read-only, order is transactional.** `POST /api/quote` only reads. `POST /api/orders` runs everything inside one `prisma.$transaction`, so a failure part way through rolls back all writes.

**Frontend sends the codes it showed.** When placing an order, the browser sends `expectedCouponCodes`, the codes the customer saw as applied. If any of them no longer apply, the server returns `409` with the new quote, and the customer confirms the new total.

## How the Calculation Works

1. **Money:** All amounts are stored as integer satang (100 satang = 1 baht) to avoid floating-point rounding issues.

2. **Coupon Codes:** Codes are trimmed and converted to uppercase. Duplicate codes and codes beyond the two-coupon limit are rejected.

3. **Coupon Order:** Non-stackable coupons are checked first, followed by stackable coupons. The original input order is preserved within each group, and results are returned in the order entered.

4. **Validation:** Each coupon is checked in order, from whether it exists and is active to its dates, usage limits, eligibility, scope, and minimum spend. The first failed check determines the rejection reason.

5. **Discounts:** Percentage discounts are calculated from the eligible amount and capped by `maxDiscount`. Fixed discounts cannot exceed the eligible amount.

6. **Splitting Discounts:** Discounts are shared across eligible cart items based on their amounts after earlier discounts. Any rounding difference goes to the largest eligible item, with the first item winning ties.

7. **Final Total:** The net amount is the subtotal minus discounts. VAT is 7% of the net amount, rounded to the nearest satang, and added to get the final total. 

## Rounding

- **Round half up** with integer arithmetic in `roundDiv`, so `0.125` becomes `0.13`.
- **No float division** for money. `roundDiv` only uses integers.
- **Exact totals.** Split discounts always add up to the discount because the leftover goes to one line.

## Concurrency and deadlocks

Placing an order runs in one database transaction. Three rules keep concurrent orders correct:

1. **Lock the customer first.** `SELECT ... FOR UPDATE` on the customer row means one customer's orders run one at a time. The second order reads the first one's updated order count and redemption counts.
2. **Use a conditional update for limited coupons.** Each coupon is consumed with `UPDATE coupons SET used_count = used_count + 1 WHERE code = ? AND (usage_limit IS NULL OR used_count < usage_limit)`. Postgres re-checks the condition after the other transaction commits, so only one of two orders can take the last use. If the update matches no row, the order throws and rolls back.
3. **Consume coupons in sorted order.** Two orders that use the same coupons in different orders could each lock one row and wait for the other, which is a deadlock. Sorting the codes gives every order the same lock order, so this can't happen. Postgres would otherwise abort one order with a deadlock error.

If any step fails, the whole transaction rolls back and the API returns `409` with a fresh quote, so the customer can confirm the new total.

## Known limitations

- **No authentication.** The customer is chosen from a dropdown. A real app would use login and sessions.
- **Concurrency is not yet tested automatically.** A supertest test should fire simultaneous orders at a coupon with a limit of 1.
- **Frontend tests are missing.** Only the engine and money helpers are tested.
- **Generic database errors.** Unique-constraint and deadlock errors return a 500. They could be mapped to clearer responses.
- **Seed is one-way.** Data changes after seeding need migrations or an admin tool.
- **No rate limiting.** Limits on request size and rate should be added before deployment.

## AI Tools

AI tools helped me develop the business logic, define the coupon rules, build the calculation logic, and debug issues during development. I reviewed the logic against the examples in `checkout.json`, and the tests cover every example.






