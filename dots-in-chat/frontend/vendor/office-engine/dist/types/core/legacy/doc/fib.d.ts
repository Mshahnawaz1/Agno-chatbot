/** The File Information Block at the start of the WordDocument stream: version, flags, text lengths, where each table is. */
import type { Bytes } from './bin';
/** indices in FibRgFcLcb (pairs of offset and size in the table stream) */
export declare const FC: {
    readonly stshf: 1;
    readonly plcffndRef: 2;
    readonly plcffndTxt: 3;
    readonly plcfandRef: 4;
    readonly plcfandTxt: 5;
    readonly plcfSed: 6;
    readonly plcfHdd: 11;
    readonly plcfBteChpx: 12;
    readonly plcfBtePapx: 13;
    readonly sttbfFfn: 15;
    readonly plcfFldMom: 16;
    readonly plcfFldHdr: 17;
    readonly plcfFldFtn: 18;
    readonly plcfFldAtn: 19;
    readonly sttbfBkmk: 21;
    readonly plcfBkf: 22;
    readonly plcfBkl: 23;
    readonly dop: 31;
    readonly clx: 33;
    readonly grpXstAtnOwners: 36;
    readonly sttbfAtnBkmk: 37;
    readonly plcSpaMom: 40;
    readonly plcSpaHdr: 41;
    readonly plcfAtnBkf: 42;
    readonly plcfAtnBkl: 43;
    readonly plcfendRef: 46;
    readonly plcfendTxt: 47;
    readonly plcfFldEdn: 48;
    readonly dggInfo: 50;
    readonly sttbfRMark: 51;
    readonly plcftxbxTxt: 56;
    readonly plcfFldTxbx: 57;
    readonly plcfHdrtxbxTxt: 58;
    readonly plcfFldHdrTxbx: 59;
    readonly plfLst: 73;
    readonly plfLfo: 74;
};
export interface Fib {
    nFib: number;
    /** the table stream is 1Table (else 0Table) */
    tbl1: boolean;
    /** character counts of the main text and the other stories */
    ccpText: number;
    ccpFtn: number;
    ccpHdd: number;
    ccpMcr: number;
    ccpAtn: number;
    ccpEdn: number;
    ccpTxbx: number;
    ccpHdrTxbx: number;
    /** offset and size of a table (FC index) */
    fc(i: number): {
        fc: number;
        lcb: number;
    };
}
/** Reads the FIB; throws for files this converter does not read (older versions, encrypted). */
export declare function readFib(wd: Bytes): Fib;
