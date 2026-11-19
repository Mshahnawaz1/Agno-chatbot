/**
 * PowerPoint binary records ([MS-PPT] 2.3, [MS-ODRAW] 2.1): an 8-byte header (version, instance, type, length),
 * then the body; containers (version 0xF) hold more records. Every read is bounds-checked: out-of-range reads give 0.
 */
/** record types used by the converter */
export declare const RT: {
    readonly Document: 1000;
    readonly DocumentAtom: 1001;
    readonly Slide: 1006;
    readonly SlideAtom: 1007;
    readonly Notes: 1008;
    readonly NotesAtom: 1009;
    readonly Environment: 1010;
    readonly SlidePersistAtom: 1011;
    readonly MainMaster: 1016;
    readonly SlideShowSlideInfoAtom: 1017;
    readonly ExObjList: 1033;
    readonly PPDrawingGroup: 1035;
    readonly PPDrawing: 1036;
    readonly List: 2000;
    readonly FontCollection: 2005;
    readonly ColorSchemeAtom: 2032;
    readonly OEPlaceholderAtom: 3011;
    readonly OutlineTextRefAtom: 3998;
    readonly TextHeaderAtom: 3999;
    readonly TextCharsAtom: 4000;
    readonly StyleTextPropAtom: 4001;
    readonly MasterTextPropAtom: 4002;
    readonly TxMasterStyleAtom: 4003;
    readonly TextCFExceptionAtom: 4004;
    readonly TextPFExceptionAtom: 4005;
    readonly TextRulerAtom: 4006;
    readonly TextBytesAtom: 4008;
    readonly TextSpecInfoAtom: 4010;
    readonly CString: 4026;
    readonly FontEntityAtom: 4023;
    readonly ExHyperlinkAtom: 4051;
    readonly ExHyperlink: 4055;
    readonly SlideNumberMCAtom: 4056;
    readonly HeadersFooters: 4057;
    readonly HeadersFootersAtom: 4058;
    readonly TxInteractiveInfoAtom: 4063;
    readonly InteractiveInfo: 4082;
    readonly InteractiveInfoAtom: 4083;
    readonly UserEditAtom: 4085;
    readonly CurrentUserAtom: 4086;
    readonly DateTimeMCAtom: 4087;
    readonly GenericDateMCAtom: 4088;
    readonly HeaderMCAtom: 4089;
    readonly FooterMCAtom: 4090;
    readonly RTFDateTimeMCAtom: 4117;
    readonly PersistDirectoryAtom: 6002;
    readonly CryptSession10Container: 12052;
    readonly DggContainer: 61440;
    readonly BStoreContainer: 61441;
    readonly DgContainer: 61442;
    readonly SpgrContainer: 61443;
    readonly SpContainer: 61444;
    readonly FBSE: 61447;
    readonly FSPGR: 61449;
    readonly FSP: 61450;
    readonly FOPT: 61451;
    readonly ClientTextbox: 61453;
    readonly ChildAnchor: 61455;
    readonly ClientAnchor: 61456;
    readonly ClientData: 61457;
    readonly SecondaryFOPT: 61729;
    readonly TertiaryFOPT: 61730;
};
/** A record: its header fields and its body inside a buffer (the body is cut to the buffer's end). */
export declare class Rec {
    readonly buf: Uint8Array;
    /** offset of the header in `buf` */
    readonly at: number;
    readonly ver: number;
    readonly inst: number;
    readonly type: number;
    /** offset of the body in `buf` */
    readonly start: number;
    /** body length, cut to what the buffer holds */
    readonly len: number;
    private kidList?;
    constructor(buf: Uint8Array, 
    /** offset of the header in `buf` */
    at: number, ver: number, inst: number, type: number, 
    /** offset of the body in `buf` */
    start: number, 
    /** body length, cut to what the buffer holds */
    len: number);
    /** the record at an offset of a buffer, or undefined when its header does not fit before `end` */
    static at(buf: Uint8Array, off: number, end?: number): Rec | undefined;
    /** offset just after the record */
    get end(): number;
    get isContainer(): boolean;
    u8(k: number): number;
    u16(k: number): number;
    i16(k: number): number;
    u32(k: number): number;
    i32(k: number): number;
    /** body bytes from `k` (to the end, or `n` bytes) */
    bytes(k?: number, n?: number): Uint8Array;
    /** the records in the body (a container's children; any record's body can be read as records) */
    kids(): Rec[];
    /** the first child of a type (and instance) */
    kid(type: number, inst?: number): Rec | undefined;
    /** the children of a type */
    all(type: number, inst?: number): Rec[];
    /** the whole body as UTF-16LE (text atoms) */
    utf16Raw(): string;
    /** a UTF-16LE string body (CString), to the first NUL */
    utf16(k?: number, n?: number): string;
}
