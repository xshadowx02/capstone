"""
Synthetic Philippine credit card statement generator.
Produces realistic Makati-area transactions for the past 3 months.
"""
import random
from datetime import date, timedelta
from typing import List, Dict

random.seed(42)

MAKATI_MERCHANTS = [
    {"name": "Jollibee Ayala Ave", "mcc": "5812", "min": 150, "max": 650},
    {"name": "McDonald's Glorietta", "mcc": "5812", "min": 120, "max": 580},
    {"name": "KFC Makati Ave", "mcc": "5812", "min": 180, "max": 720},
    {"name": "Chowking Salcedo", "mcc": "5812", "min": 130, "max": 420},
    {"name": "Greenwich Pizza Makati", "mcc": "5812", "min": 250, "max": 850},
    {"name": "Ministop Dela Rosa", "mcc": "5812", "min": 50, "max": 280},
    {"name": "Starbucks Reserve Greenbelt", "mcc": "5812", "min": 180, "max": 680},
    {"name": "Bo's Coffee Ayala", "mcc": "5812", "min": 140, "max": 450},
    {"name": "Toby's Estate Salcedo", "mcc": "5812", "min": 160, "max": 520},
    {"name": "Figaro Coffee Glorietta", "mcc": "5812", "min": 130, "max": 480},
    {"name": "Wildflour Cafe BGC", "mcc": "5812", "min": 350, "max": 1800},
    {"name": "Sala Makati Fine Dining", "mcc": "5812", "min": 800, "max": 4500},
    {"name": "Vikings Buffet SM Aura", "mcc": "5812", "min": 1200, "max": 2200},
    {"name": "Ninyo Fusion Cuisine", "mcc": "5812", "min": 600, "max": 3200},
    {"name": "Locavore Makati", "mcc": "5812", "min": 450, "max": 2100},
    {"name": "GrabFood", "mcc": "5812", "min": 200, "max": 1200},
    {"name": "FoodPanda", "mcc": "5812", "min": 180, "max": 1000},
    {"name": "SM Supermarket Makati", "mcc": "5411", "min": 800, "max": 6500},
    {"name": "Rustan's Supermarket Ayala", "mcc": "5411", "min": 1200, "max": 8000},
    {"name": "Puregold Makati", "mcc": "5411", "min": 600, "max": 5000},
    {"name": "Robinsons Supermarket Ermita", "mcc": "5411", "min": 700, "max": 5500},
    {"name": "Landers Superstore Pasay", "mcc": "5411", "min": 2000, "max": 12000},
    {"name": "S&R Membership Bicutan", "mcc": "5411", "min": 2500, "max": 15000},
    {"name": "Grab", "mcc": "4121", "min": 60, "max": 850},
    {"name": "Angkas", "mcc": "4121", "min": 50, "max": 280},
    {"name": "Petron Makati Ave", "mcc": "5541", "min": 1200, "max": 4500},
    {"name": "Shell Buendia", "mcc": "5541", "min": 1100, "max": 4200},
    {"name": "SM Mall Parking", "mcc": "7523", "min": 40, "max": 180},
    {"name": "Zara Greenbelt", "mcc": "5691", "min": 1500, "max": 8500},
    {"name": "H&M SM Makati", "mcc": "5691", "min": 800, "max": 5000},
    {"name": "Uniqlo Ayala", "mcc": "5691", "min": 600, "max": 4500},
    {"name": "National Bookstore Glorietta", "mcc": "5942", "min": 200, "max": 2500},
    {"name": "SM Department Store Makati", "mcc": "5311", "min": 500, "max": 7000},
    {"name": "Lazada", "mcc": "5999", "min": 300, "max": 12000},
    {"name": "Shopee", "mcc": "5999", "min": 200, "max": 10000},
    {"name": "SM Cinema Makati", "mcc": "7832", "min": 250, "max": 800},
    {"name": "Netflix", "mcc": "7841", "min": 249, "max": 549},
    {"name": "Spotify", "mcc": "7929", "min": 129, "max": 249},
    {"name": "Timezone Glorietta", "mcc": "7993", "min": 100, "max": 800},
    {"name": "Watsons Ayala", "mcc": "5912", "min": 150, "max": 2500},
    {"name": "Mercury Drug Makati", "mcc": "5912", "min": 200, "max": 3000},
    {"name": "Makati Medical Center", "mcc": "8011", "min": 1500, "max": 15000},
    {"name": "Anytime Fitness Salcedo", "mcc": "7011", "min": 1800, "max": 2500},
    {"name": "The Spa Greenbelt", "mcc": "7299", "min": 800, "max": 3500},
    {"name": "Meralco", "mcc": "4911", "min": 3000, "max": 9000},
    {"name": "PLDT", "mcc": "4813", "min": 1299, "max": 2999},
    {"name": "Globe Telecom", "mcc": "4813", "min": 799, "max": 1999},
    {"name": "Manila Water", "mcc": "4941", "min": 400, "max": 1500},
    {"name": "Converge ICT", "mcc": "4813", "min": 1499, "max": 2999},
    {"name": "Cebu Pacific", "mcc": "4511", "min": 1500, "max": 18000},
    {"name": "Philippine Airlines", "mcc": "4511", "min": 3000, "max": 45000},
    {"name": "Airbnb", "mcc": "7011", "min": 2500, "max": 25000},
    {"name": "Agoda", "mcc": "7011", "min": 2000, "max": 20000},
    {"name": "Udemy", "mcc": "8299", "min": 399, "max": 2999},
    {"name": "Coursera", "mcc": "8299", "min": 599, "max": 1999},
]


def generate_synthetic_statements(num_transactions: int = 60) -> List[Dict]:
    end_date = date.today()
    start_date = end_date - timedelta(days=90)
    transactions = []

    weights = []
    for m in MAKATI_MERCHANTS:
        if m["mcc"] in ("5812", "4121"):
            weights.append(5)
        elif m["mcc"] in ("5411",):
            weights.append(3)
        elif m["mcc"] in ("4813", "4911", "4941"):
            weights.append(1)
        else:
            weights.append(2)

    for _ in range(num_transactions):
        merchant = random.choices(MAKATI_MERCHANTS, weights=weights, k=1)[0]
        days_back = random.randint(0, 90)
        txn_date = end_date - timedelta(days=days_back)
        amount = round(random.uniform(merchant["min"], merchant["max"]), 2)
        raw_text = f"{merchant['name']} - PHP {amount:,.2f}"
        transactions.append({
            "transaction_date": txn_date.isoformat(),
            "merchant_name": merchant["name"],
            "merchant_category_code": merchant["mcc"],
            "amount": amount,
            "description": f"POS purchase at {merchant['name']}",
            "raw_text": raw_text,
        })

    transactions.sort(key=lambda x: x["transaction_date"], reverse=True)
    return transactions
