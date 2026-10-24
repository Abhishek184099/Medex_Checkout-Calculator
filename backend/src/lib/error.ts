export class AppError extends Error{
    constructor(
        readonly status : number,
        message : string,
       readonly details : Record<string, unknown> = {}
    ){
        super(message);
        this.name = "AppError"
    }
}

export class ConflictError extends AppError{
    constructor(
        message : string,
        details : Record<string ,unknown> = {}
    ){
       super(409 , message , details)
    }
}

export class QuoteChangedError extends Error {
  constructor(readonly lostCodes: string[]) {
    super("Quote changed");
  }
}

