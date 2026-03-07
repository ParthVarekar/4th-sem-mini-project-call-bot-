// ============================================================
// ChefAI Mock Restaurant Data
// ============================================================

export interface MenuItem {
    name: string;
    price: number;
    category: string;
}

export interface ComboMeal {
    name: string;
    items: string[];
    price: number;
    popular?: boolean;
}

export interface Special {
    name: string;
    price: number;
    tag: string;
}

export interface ReservationSlot {
    time: string;
    tableSize: number;
    available: boolean;
}

// --- Menu (From AI Backend menu_items.csv) ---
export const menuItems: MenuItem[] = [
    { name: 'Burger', price: 8.99, category: 'Main' },
    { name: 'Fries', price: 3.99, category: 'Side' },
    { name: 'Coke', price: 1.99, category: 'Drink' },
    { name: 'Pizza', price: 12.99, category: 'Main' },
    { name: 'Chicken Wrap', price: 9.49, category: 'Main' },
    { name: 'Caesar Salad', price: 7.49, category: 'Side' },
    { name: 'Pasta', price: 11.49, category: 'Main' },
    { name: 'Garlic Bread', price: 4.49, category: 'Side' },
];

// --- Combos (From AI Backend Apriori Recommendations) ---
export const comboMeals: ComboMeal[] = [
    {
        name: 'Burger & Fries Combo',
        items: ['Burger', 'Fries'],
        price: 11.50, // 12.98 value
        popular: true, // Support: 17.92%
    },
    {
        name: 'Pizza & Drink Combo',
        items: ['Pizza', 'Coke'],
        price: 13.50, // 14.98 value
        popular: true, // Support: 12.04%
    },
    {
        name: 'Pasta & Bread Combo',
        items: ['Pasta', 'Garlic Bread'],
        price: 14.50, // 15.98 value
    },
    {
        name: 'Wrap & Fries Combo',
        items: ['Chicken Wrap', 'Fries'],
        price: 12.00, // 13.48 value
    },
];

// --- Today's Specials (Based on Popular Items from AI Insights) ---
export const todaySpecials: Special[] = [
    { name: 'Burger', price: 7.99, tag: 'top seller' },
    { name: 'Pizza', price: 10.99, tag: 'discounted' },
    { name: 'Burger & Fries Combo', price: 10.50, tag: 'combo deal' },
];

// --- Reservations (Based on Peak Hours from AI Insights) ---
export const reservationSlots: ReservationSlot[] = [
    { time: '6:00 PM', tableSize: 2, available: false }, // 18:00 Peak
    { time: '7:00 PM', tableSize: 4, available: false }, // 19:00 Peak
    { time: '8:00 PM', tableSize: 6, available: true },  // 20:00 Peak available
];

// --- Kitchen Status Messages (Based on AI Insights) ---
export const kitchenStatuses: string[] = [
    'Kitchen is preparing for peak hours at 7:00 PM.',
    'Burger and Fries are trending today — high volume.',
    'Weekend prep in progress for expected rush.',
    'Kitchen is currently handling average order volume of $14.10.',
];
