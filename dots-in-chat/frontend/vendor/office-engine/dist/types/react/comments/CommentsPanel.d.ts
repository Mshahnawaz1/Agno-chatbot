import { type CommentUser } from '../../core/comments';
import { type CommentsCtl } from './Comments';
/** shortcut that starts a comment on the selection */
export declare const COMMENT_KEYS: string;
/** text box for comments: Enter posts (Shift+Enter: new line), "@" suggests people */
export declare function Composer(props: {
    ctl: CommentsCtl;
    placeholder: string;
    submit: string;
    initial?: string;
    mentions?: CommentUser[];
    autoFocus?: boolean;
    onSubmit: (text: string, mentions: CommentUser[]) => Promise<boolean>;
    onCancel?: () => void;
}): import("react").JSX.Element;
export declare function CommentsPanel({ ctl }: {
    ctl: CommentsCtl;
}): import("react").JSX.Element;
