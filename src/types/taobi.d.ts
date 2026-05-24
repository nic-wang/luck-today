declare module 'taobi' {
  export class TheArtOfBecomingInvisible {
    constructor(date: Date);
    getCanvas(): Array<Array<[
      [string, string, string],
      [string, string, string],
      [string, string, string]
    ]>>;
    getSymbol(is?: boolean): string;
    getSolarTerms?(is?: boolean): string;
  }
}
