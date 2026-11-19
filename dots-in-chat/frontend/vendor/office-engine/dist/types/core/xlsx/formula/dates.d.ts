/** Date serials (1900 system with the Lotus leap-year bug, or 1904) and date/time text parsing. */
export declare function getDate1904(): boolean;
export declare function setDate1904(v: boolean): void;
/** Serial for y/m/d (m 1-based; month/day overflow normalized like DATE()). */
export declare function ymdToSerial(y: number, m: number, d: number): number;
export interface DateParts {
    y: number;
    m: number;
    d: number;
    /** 0 = Sunday */
    dow: number;
}
export declare function serialToYmd(serial: number): DateParts;
/** Seconds of the day (rounded to the nearest second). */
export declare function serialSeconds(serial: number): number;
export declare function daysInMonth(y: number, m: number): number;
/** Serial of a JS Date using its local calendar components. */
export declare function dateToSerial(dt: Date): number;
/** Parse date/time text: `yyyy-mm-dd [time]`, `m/d/yyyy [time]`, `15-Jan-2024`, `Jan 15, 2024`, `Jan 2024`, `hh:mm[:ss] [AM/PM]`. */
export declare function parseDateText(s: string): number | null;
/** Serial of an ISO date / date-time as a `t="d"` cell holds it (`2024-01-15`, `2024-01-15T06:00:00Z`, `12:30:00`); null when it is not one. */
export declare function isoToSerial(iso: string, date1904: boolean): number | null;
