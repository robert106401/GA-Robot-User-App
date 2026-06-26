import { XpRecord } from "./types";

const BUSINESS_RECORD_ID_PATTERN = /\b(?:ORD|PAY|AF|GFT|GV|EC|VC|CP|MSN)-[A-Z0-9-]+\b/;

export function getXpSourceRecordId(record: XpRecord) {
  return record.eventKey.match(BUSINESS_RECORD_ID_PATTERN)?.[0];
}
