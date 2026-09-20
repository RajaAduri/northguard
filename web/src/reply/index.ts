// AF-503 — Reply rehydration view (US-034). Consumes E3 AF-307; never guesses (NG-9);
// restored content is display-only and never re-enters the wire (NG-1).
export { buildReplyView } from './buildReplyView'
export { buildCopyModel } from './buildCopyModel'
export { buildRestoreSuggestion } from './buildRestoreSuggestion'
export { ReplyMessage, type ReplyMessageProps } from './ReplyMessage'
