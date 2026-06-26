import { type ProductLabelKey } from "../productLabels";
import { type OrderRecord, type PaymentHistoryRecord, type WalletHistoryRecord } from "../types";

export type SkuCategory = "Coffee" | "Milk Tea" | "Combo" | "Tea" | "Functional Drink";

export type SKU = {
  id: string;
  code: string;
  name: string;
  category: SkuCategory;
  price: string;
  memberPrice: string;
  labels: ProductLabelKey[];
  customizationGroups: SkuCustomizationGroup[];
  stock: number;
  recentSales: number;
  color: string;
};

export type MemberVoucher = {
  id: string;
  title: string;
  scope: "Any drink" | "Coffee only" | "Milk tea only" | "Combo only";
  value: number;
  expires: string;
  expiresAt: string;
  status: "Active" | "Used" | "Expired";
  source: "Welcome" | "Gift" | "Purchased" | "Campaign";
  code: string;
  redeemRules: string;
  usedAt?: string;
};

export type PartnerOffer = {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  offerType: "claim_coupon" | "purchase_offer";
  purchaseCategory?: "set_menu" | "ticket";
  actionLabel: "Claim" | "Buy" | "View";
  assetCouponId?: string;
  price?: string;
  retailValue?: string;
  distance: string;
  address: string;
  validUntil: string;
  expires: string;
  claimedCount: number;
  logoLabel: string;
  logoColor: string;
  logoTextColor: string;
  status: "Active" | "Claimed" | "Sold out" | "Ended" | "Coming soon";
};

export type SkuCustomizationGroup = {
  id: string;
  title: string;
  options: string[];
  visibleWhen?: {
    groupId: string;
    values: string[];
  };
};

const coldDrinkOptions: SkuCustomizationGroup[] = [
  { id: "temperature", title: "Temperature", options: ["Cold", "Room Temp"] },
  { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Cold"] } }
];

const coffeeOptions: SkuCustomizationGroup[] = [
  { id: "temperature", title: "Temperature", options: ["Hot", "Iced"] },
  { id: "milk", title: "Milk", options: ["Regular Milk", "Oat Milk", "No Milk"] },
  { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Iced"] } }
];

const milkTeaOptions: SkuCustomizationGroup[] = [
  { id: "temperature", title: "Temperature", options: ["Cold", "Hot"] },
  { id: "sweetness", title: "Sugar", options: ["100%", "70%", "50%", "0%"] },
  { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Cold"] } }
];

const comboOptions: SkuCustomizationGroup[] = [
  { id: "temperature", title: "Drink Temp", options: ["Hot", "Iced"] },
  { id: "milk", title: "Milk", options: ["Regular Milk", "Oat Milk"] },
  { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Iced"] } },
  { id: "side", title: "Side", options: ["Croissant", "Cookie", "Protein Bar"] }
];

const icedDuoOptions: SkuCustomizationGroup[] = [
  { id: "coffeeIce", title: "Coffee Ice", options: ["Regular Ice", "Less Ice", "No Ice"] },
  { id: "barleyTeaIce", title: "Barley Tea Ice", options: ["Regular Ice", "Less Ice", "No Ice"] }
];

const studyPairOptions: SkuCustomizationGroup[] = [
  { id: "latteTemperature", title: "Oat Latte", options: ["Hot", "Iced"] },
  { id: "oolongTemperature", title: "Oolong Milk Tea", options: ["Cold", "Hot"] },
  { id: "oolongSweetness", title: "Oolong Sugar", options: ["70%", "50%", "0%"] }
];

export const memberAssets = {
  points: 8000,
  coupons: 6,
  vouchers: 3,
  benefits: 3,
  balance: "$24.50",
  registeredDate: "2024-09-18",
  dailyRegistrationSequence: 4826,
  expiringSoon: 2
};

export const campaigns = [
  {
    id: "campaign-1",
    eyebrow: "BONUS",
    title: "Add Funds, Get More",
    subtitle: "Add $100 and receive $15 Bonus",
    action: "View Bonus",
    icon: "wallet-outline",
    target: "topup"
  },
  {
    id: "campaign-2",
    eyebrow: "MEMBER MORNING",
    title: "Morning Coffee Pass",
    subtitle: "Member pricing from $2.99 before 10 AM on weekdays",
    action: "View Offer",
    icon: "cafe-outline",
    target: "coffee"
  },
  {
    id: "campaign-3",
    eyebrow: "GIFT MOMENT",
    title: "Send a Friend a Drink",
    subtitle: "Send a Gift Voucher for coffee or milk tea in a few taps",
    action: "Send Gift",
    icon: "gift-outline",
    target: "gift"
  },
  {
    id: "campaign-4",
    eyebrow: "LIMITED OFFER",
    title: "Milk Tea Week",
    subtitle: "Get 50% off the second selected milk tea this week",
    action: "Get Coupon",
    icon: "ticket-outline",
    target: "coupons"
  }
] as const;

export const skus: SKU[] = [
  {
    id: "sku-1",
    code: "SKU-0001",
    name: "Iced Americano",
    category: "Coffee",
    price: "$3.80",
    memberPrice: "$3.20",
    labels: ["popular", "light"],
    customizationGroups: [
      { id: "temperature", title: "Temperature", options: ["Iced", "Hot"] },
      { id: "milk", title: "Milk", options: ["No Milk", "Regular Milk", "Oat Milk"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Iced"] } }
    ],
    stock: 18,
    recentSales: 238,
    color: "#A87652"
  },
  {
    id: "sku-2",
    code: "SKU-0002",
    name: "Oat Milk Latte",
    category: "Coffee",
    price: "$4.90",
    memberPrice: "$4.20",
    labels: ["new", "oat"],
    customizationGroups: coffeeOptions,
    stock: 9,
    recentSales: 126,
    color: "#D4B489"
  },
  {
    id: "sku-3",
    code: "SKU-0003",
    name: "Classic Bubble Tea",
    category: "Milk Tea",
    price: "$5.20",
    memberPrice: "$4.60",
    labels: ["popular"],
    customizationGroups: milkTeaOptions,
    stock: 12,
    recentSales: 214,
    color: "#C8924F"
  },
  {
    id: "sku-4",
    code: "SKU-0004",
    name: "Latte + Croissant Set",
    category: "Combo",
    price: "$7.80",
    memberPrice: "$6.80",
    labels: ["combo", "breakfast"],
    customizationGroups: comboOptions,
    stock: 8,
    recentSales: 96,
    color: "#9B6F4D"
  },
  {
    id: "sku-5",
    code: "SKU-0005",
    name: "Bubble Tea Duo",
    category: "Combo",
    price: "$9.90",
    memberPrice: "$8.80",
    labels: ["combo", "share"],
    customizationGroups: [
      { id: "temperature", title: "Drink Temp", options: ["Cold", "Hot"] },
      { id: "sweetness", title: "Sugar", options: ["70%", "50%", "0%"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Cold"] } }
    ],
    stock: 6,
    recentSales: 84,
    color: "#B87855"
  },
  {
    id: "sku-6",
    code: "SKU-0006",
    name: "Jasmine Low Sugar Tea",
    category: "Tea",
    price: "$4.60",
    memberPrice: "$4.00",
    labels: ["light", "new"],
    customizationGroups: coldDrinkOptions,
    stock: 14,
    recentSales: 142,
    color: "#7FA36A"
  },
  {
    id: "sku-7",
    code: "SKU-0007",
    name: "Protein Oat Latte",
    category: "Coffee",
    price: "$5.60",
    memberPrice: "$4.90",
    labels: ["protein", "oat"],
    customizationGroups: [
      { id: "temperature", title: "Temperature", options: ["Iced", "Hot"] },
      { id: "milk", title: "Milk", options: ["Oat Milk", "Regular Milk"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Iced"] } }
    ],
    stock: 10,
    recentSales: 118,
    color: "#8A9B65"
  },
  {
    id: "sku-8",
    code: "SKU-0008",
    name: "Electrolyte Sparkling Water",
    category: "Functional Drink",
    price: "$3.90",
    memberPrice: "$3.40",
    labels: ["light", "hydrate"],
    customizationGroups: [
      { id: "temperature", title: "Temperature", options: ["Cold", "Room Temp"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Cold"] } }
    ],
    stock: 0,
    recentSales: 132,
    color: "#6EA0A2"
  },
  {
    id: "sku-9",
    code: "SKU-0009",
    name: "Sea Salt Caramel Cold Brew",
    category: "Coffee",
    price: "$5.40",
    memberPrice: "$4.70",
    labels: ["new", "popular"],
    customizationGroups: [
      { id: "temperature", title: "Temperature", options: ["Iced"] },
      { id: "foam", title: "Sea Salt Foam", options: ["Regular", "Light", "None"] },
      { id: "caramel", title: "Caramel", options: ["Regular", "Light", "None"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"] }
    ],
    stock: 13,
    recentSales: 177,
    color: "#976543"
  },
  {
    id: "sku-10",
    code: "SKU-0010",
    name: "Maple Cinnamon Flat White",
    category: "Coffee",
    price: "$5.10",
    memberPrice: "$4.40",
    labels: ["new", "oat"],
    customizationGroups: [
      { id: "temperature", title: "Temperature", options: ["Hot", "Iced"] },
      { id: "milk", title: "Milk", options: ["Regular Milk", "Oat Milk"] },
      { id: "maple", title: "Maple", options: ["Regular", "Light"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice"], visibleWhen: { groupId: "temperature", values: ["Iced"] } }
    ],
    stock: 11,
    recentSales: 103,
    color: "#B88049"
  },
  {
    id: "sku-11",
    code: "SKU-0011",
    name: "Coconut Espresso Cloud",
    category: "Coffee",
    price: "$5.50",
    memberPrice: "$4.80",
    labels: ["new", "light"],
    customizationGroups: [
      { id: "temperature", title: "Temperature", options: ["Iced", "Hot"] },
      { id: "coconutCream", title: "Coconut Cream", options: ["Regular", "Light"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Iced"] } }
    ],
    stock: 10,
    recentSales: 119,
    color: "#B09170"
  },
  {
    id: "sku-12",
    code: "SKU-0012",
    name: "Roasted Oolong Milk Tea",
    category: "Milk Tea",
    price: "$5.30",
    memberPrice: "$4.60",
    labels: ["popular", "light"],
    customizationGroups: milkTeaOptions,
    stock: 15,
    recentSales: 192,
    color: "#9D6F49"
  },
  {
    id: "sku-13",
    code: "SKU-0013",
    name: "Strawberry Matcha Milk Tea",
    category: "Milk Tea",
    price: "$5.80",
    memberPrice: "$5.00",
    labels: ["new", "popular"],
    customizationGroups: [
      { id: "temperature", title: "Temperature", options: ["Cold"] },
      { id: "sweetness", title: "Sugar", options: ["70%", "50%", "0%"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"] },
      { id: "pearls", title: "Pearls", options: ["Regular", "Light", "None"] }
    ],
    stock: 9,
    recentSales: 168,
    color: "#8F9F67"
  },
  {
    id: "sku-14",
    code: "SKU-0014",
    name: "Couple's Ice Duo",
    category: "Combo",
    price: "$8.40",
    memberPrice: "$7.20",
    labels: ["combo", "share", "new"],
    customizationGroups: icedDuoOptions,
    stock: 8,
    recentSales: 88,
    color: "#708B97"
  },
  {
    id: "sku-15",
    code: "SKU-0015",
    name: "Study Night Pair",
    category: "Combo",
    price: "$9.60",
    memberPrice: "$8.20",
    labels: ["combo", "share"],
    customizationGroups: studyPairOptions,
    stock: 7,
    recentSales: 72,
    color: "#656D81"
  },
  {
    id: "sku-16",
    code: "SKU-0016",
    name: "Exam Sprint Mocha",
    category: "Coffee",
    price: "$5.90",
    memberPrice: "$5.10",
    labels: ["new", "popular", "protein"],
    customizationGroups: [
      { id: "temperature", title: "Temperature", options: ["Hot", "Iced"] },
      { id: "espresso", title: "Espresso Shot", options: ["Double Shot", "Triple Shot", "Single Shot"] },
      { id: "milk", title: "Milk", options: ["Regular Milk", "Oat Milk", "No Milk"] },
      { id: "sweetness", title: "Sweetness", options: ["Regular", "Less Sweet", "No Sugar"] },
      { id: "ice", title: "Ice", options: ["Regular Ice", "Less Ice", "No Ice"], visibleWhen: { groupId: "temperature", values: ["Iced"] } }
    ],
    stock: 12,
    recentSales: 156,
    color: "#53382B"
  }
];

export const vouchers: MemberVoucher[] = [
  {
    id: "voucher-welcome-drink",
    title: "Welcome Free Drink",
    scope: "Any drink",
    value: 6.5,
    expires: "Jul 21",
    expiresAt: "2026-07-21",
    status: "Active",
    source: "Welcome",
    code: "VC-260621-000001",
    redeemRules: "Redeem one eligible coffee or milk tea."
  },
  {
    id: "voucher-coffee-pass",
    title: "Morning Coffee Voucher",
    scope: "Coffee only",
    value: 5,
    expires: "Jul 08",
    expiresAt: "2026-07-08",
    status: "Active",
    source: "Campaign",
    code: "VC-260621-000002",
    redeemRules: "Valid for one coffee item before 11 AM."
  },
  {
    id: "voucher-milk-tea",
    title: "Milk Tea Treat",
    scope: "Milk tea only",
    value: 5.5,
    expires: "Aug 01",
    expiresAt: "2026-08-01",
    status: "Active",
    source: "Gift",
    code: "VC-260621-000003",
    redeemRules: "Redeem one eligible milk tea."
  },
  {
    id: "voucher-used-duo",
    title: "Double Drink Voucher",
    scope: "Combo only",
    value: 10,
    expires: "Jun 10",
    expiresAt: "2026-06-10",
    status: "Used",
    source: "Purchased",
    code: "VC-260621-000004",
    redeemRules: "Any two drinks.",
    usedAt: "2026-06-09 08:42"
  }
];

export const coupons = [
  {
    id: "coupon-happy-lamb-20-off",
    code: "CP-260621-000001",
    kind: "Partner",
    status: "Discoverable",
    merchant: "Happy Lamb Hot Pot",
    offer: "20% off the full bill",
    distance: "7.4km",
    expires: "Jul 31",
    expiringSoon: true,
    logoLabel: "HL",
    logoColor: "#B43225",
    logoTextColor: "#FFFFFF",
    claimedCount: 312
  },
  {
    id: "coupon-2",
    code: "CP-260621-000002",
    kind: "Partner",
    status: "Discoverable",
    merchant: "Campus Deli",
    offer: "Free snack after 2 drinks",
    distance: "260m",
    expires: "Jun 19",
    expiringSoon: true,
    logoLabel: "CD",
    logoColor: "#D4513F",
    logoTextColor: "#FFFFFF",
    claimedCount: 963
  },
  {
    id: "coupon-3",
    code: "CP-260621-000003",
    kind: "Partner",
    status: "Claimed",
    merchant: "Book Corner",
    offer: "10% off receipt bundle",
    distance: "450m",
    expires: "Jul 15",
    expiringSoon: false,
    logoLabel: "BC",
    logoColor: "#315D7C",
    logoTextColor: "#FFFFFF",
    claimedCount: 1248
  },
  {
    id: "coupon-4",
    code: "CP-260621-000004",
    kind: "Partner",
    status: "Discoverable",
    merchant: "Fresh Bowl",
    offer: "$3 off lunch combo",
    distance: "520m",
    expires: "Jul 22",
    expiringSoon: false,
    logoLabel: "FB",
    logoColor: "#4F7D55",
    logoTextColor: "#FFFFFF",
    claimedCount: 786
  },
  {
    id: "coupon-5",
    code: "CP-260621-000005",
    kind: "Partner",
    status: "Discoverable",
    merchant: "Campus Fitness",
    offer: "Free day pass with any drink",
    distance: "680m",
    expires: "Aug 01",
    expiringSoon: false,
    logoLabel: "CF",
    logoColor: "#252A32",
    logoTextColor: "#C4E538",
    claimedCount: 2156
  },
  {
    id: "coupon-6",
    code: "CP-260621-000006",
    kind: "Gift Coupon",
    status: "Claimed",
    merchant: "Gift from Mia",
    offer: "15% off your next drink",
    distance: "Gift",
    expires: "Jul 05",
    expiringSoon: false,
    logoLabel: "GC",
    logoColor: "#E8626B",
    logoTextColor: "#FFFFFF",
    claimedCount: 1
  }
];

export const partnerOffers: PartnerOffer[] = [
  {
    id: "offer-happy-lamb-20-off",
    partnerId: "partner-happy-lamb-coquitlam",
    partnerName: "Happy Lamb Hot Pot",
    title: "20% off full bill",
    description: "Claim this partner coupon and use it at Happy Lamb Hot Pot.",
    offerType: "claim_coupon",
    actionLabel: "Claim",
    assetCouponId: "coupon-happy-lamb-20-off",
    distance: "7.4km",
    address: "25136 Lincoln Ave, Coquitlam, BC V3B 7L9",
    validUntil: "2026-07-31",
    expires: "Jul 31",
    claimedCount: 321,
    logoLabel: "HL",
    logoColor: "#B43225",
    logoTextColor: "#FFFFFF",
    status: "Active"
  },
  {
    id: "offer-happy-lamb-100-combo",
    partnerId: "partner-happy-lamb-coquitlam",
    partnerName: "Happy Lamb Hot Pot",
    title: "A $200 value package",
    description: "Buy in the app, then redeem at the restaurant when dining in.",
    offerType: "purchase_offer",
    purchaseCategory: "set_menu",
    actionLabel: "Buy",
    price: "$100",
    retailValue: "$200",
    distance: "7.4km",
    address: "25136 Lincoln Ave, Coquitlam, BC V3B 7L9",
    validUntil: "2026-08-31",
    expires: "Aug 31",
    claimedCount: 128,
    logoLabel: "HL",
    logoColor: "#B43225",
    logoTextColor: "#FFFFFF",
    status: "Active"
  },
  {
    id: "offer-cineplex-coquitlam",
    partnerId: "partner-cineplex-coquitlam",
    partnerName: "Cineplex Cinemas Coquitlam",
    title: "Partner movie ticket",
    description: "Buy a partner movie ticket in the app, then redeem at Cineplex Cinemas Coquitlam.",
    offerType: "purchase_offer",
    purchaseCategory: "ticket",
    actionLabel: "Buy",
    price: "$18",
    retailValue: "Movie ticket",
    distance: "10.8km",
    address: "170 Schoolhouse St, Coquitlam, BC V3K 6V6",
    validUntil: "2026-08-15",
    expires: "Aug 15",
    claimedCount: 486,
    logoLabel: "CX",
    logoColor: "#1C4E9A",
    logoTextColor: "#FFFFFF",
    status: "Active"
  },
  {
    id: "offer-fifa-2026-vip-bc-place",
    partnerId: "partner-fifa-2026-bc-place",
    partnerName: "2026 FIFA Canada Home Match",
    title: "$2,000 VIP zone ticket at BC Place",
    description: "Purchase VIP zone access for a Canada home match at BC Place Vancouver.",
    offerType: "purchase_offer",
    purchaseCategory: "ticket",
    actionLabel: "Buy",
    price: "$2,000",
    retailValue: "VIP ticket",
    distance: "28.5km",
    address: "BC Place Vancouver, 777 Pacific Blvd, Vancouver, BC V6B 4Y8",
    validUntil: "2026-06-01",
    expires: "Jun 01",
    claimedCount: 64,
    logoLabel: "26",
    logoColor: "#126B4F",
    logoTextColor: "#FFFFFF",
    status: "Active"
  }
];

export const memberBenefits = [
  {
    id: "benefit-1",
    title: "Gold member price",
    description: "Unlock member pricing on eligible coffee, tea and combo products.",
    icon: "pricetag-outline" as const,
    status: "Active"
  },
  {
    id: "benefit-2",
    title: "11 Points per $1 in app",
    description: "Earn 11 Points for every eligible dollar paid through the app.",
    icon: "sparkles-outline" as const,
    status: "Active"
  },
  {
    id: "benefit-3",
    title: "Wallet Bonus",
    description: "Receive promotional Bonus Balance on eligible Add Funds amounts.",
    icon: "gift-outline" as const,
    status: "Active"
  }
];

export const vendingMachines = [
  {
    id: "vm-1",
    name: "Happy Lamb Hot Pot, Coquitlam",
    distance: "80m",
    status: "Online",
    machineType: "Cafe & Tea",
    highlight: "Coffee hot drinks available",
    inventory: "32 drinks",
    address: "25136 Lincoln Ave, Coquitlam, BC V3B 7L9",
    hours: "24 hours",
    lastRestocked: "Today 07:30",
    temperature: "Hot & cold",
    payments: ["Wallet", "Apple Pay", "Credit Card"],
    availableCategories: ["Coffee", "Combo", "Tea", "Functional Drink"]
  },
  {
    id: "vm-2",
    name: "VM 021 - Station Gate",
    distance: "210m",
    status: "Online",
    machineType: "Ice Cream",
    highlight: "Milk tea best sellers restocked",
    inventory: "48 drinks",
    address: "Station Gate B, Ticket Hall",
    hours: "06:00 - 23:30",
    lastRestocked: "Today 10:10",
    temperature: "Cold",
    payments: ["Wallet", "Apple Pay", "Coupon"],
    availableCategories: ["Milk Tea", "Combo", "Tea", "Functional Drink"]
  },
  {
    id: "vm-3",
    name: "VM 034 - Office Tower",
    distance: "620m",
    status: "Maintenance soon",
    machineType: "Meal Box",
    highlight: "Low sugar series available",
    inventory: "19 drinks",
    address: "Office Tower A, B1 Pantry",
    hours: "07:00 - 21:00",
    lastRestocked: "Yesterday 18:45",
    temperature: "Cold",
    payments: ["Wallet", "Credit Card"],
    availableCategories: ["Coffee", "Milk Tea", "Tea", "Functional Drink"]
  }
];

export const balanceChangeHistory: WalletHistoryRecord[] = [];

export const transactionHistory: PaymentHistoryRecord[] = [];
