import type { PartnerOffer } from "./data/appData";

export function getPartnerOfferValueLabel(offer: PartnerOffer) {
  if (offer.price) {
    return offer.price;
  }
  const percentMatch = offer.title.match(/\d+%/);
  if (percentMatch) {
    return percentMatch[0];
  }
  const freeMatch = offer.title.match(/\b\d+\s+free\b/i);
  if (freeMatch) {
    return freeMatch[0].toLowerCase();
  }
  if (offer.title.toLowerCase().includes("free")) {
    return "Free";
  }
  return offer.actionLabel;
}
