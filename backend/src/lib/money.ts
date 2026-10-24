const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export function parseMoney(value:string) : number{
    if(!MONEY_PATTERN.test(value)) throw new Error(`Invalid money amount: ${value}`);
    const [whole , fraction = ""] = value.split(".")
    return Number(whole) * 100 + Number(fraction.padEnd(2,"0"))
}

export function formatMoney(satang : number ) : string{
    const sign = satang <0 ? "-" : ""
    const abs = Math.abs(satang)
    const whole = Math.floor(abs/100).toString()
    return `${sign}${whole}.${String(abs % 100).padStart(2, "0")}`;
}

export function roundDiv(numerator: number, denominator: number): number {
  const magnitude = Math.floor((2 * Math.abs(numerator) + denominator) / (2 * denominator));
  return numerator < 0 ? -magnitude : magnitude;
}