"""
RAG module -- manages the QDrant collection of spending-category examples
and retrieves relevant context for categorization.
"""
import logging
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from config import settings
from llm import llm_client

logger = logging.getLogger(__name__)

CATEGORY_EXAMPLES = [
    {"text": "Jollibee EDSA  burger combo meal", "category": "Food & Dining", "subcategory": "Fast Food"},
    {"text": "McDonald's Glorietta order drive-thru", "category": "Food & Dining", "subcategory": "Fast Food"},
    {"text": "KFC Ayala purchase chicken bucket", "category": "Food & Dining", "subcategory": "Fast Food"},
    {"text": "Chowking  Ave pork chao fan", "category": "Food & Dining", "subcategory": "Fast Food"},
    {"text": "Greenwich Pizza Greenbelt delivery", "category": "Food & Dining", "subcategory": "Fast Food"},
    {"text": "Starbucks Reserve BGC coffee latte", "category": "Food & Dining", "subcategory": "Coffee"},
    {"text": "Bo's Coffee", "category": "Food & Dining", "subcategory": "Coffee"},
    {"text": "Dot Coffee", "category": "Food & Dining", "subcategory": "Coffee"},
    {"text": "Wildflour Cafe Bonifacio restaurant dining", "category": "Food & Dining", "subcategory": "Restaurant"},
    {"text": "Aristocrat Restaurant Roxas Blvd Filipino food", "category": "Food & Dining", "subcategory": "Restaurant"},
    {"text": "Sentro 1771 Greenbelt fine dining", "category": "Food & Dining", "subcategory": "Restaurant"},
    {"text": "Vikings Buffet SM Aura unlimited dining", "category": "Food & Dining", "subcategory": "Restaurant"},
    {"text": "GrabFood delivery  order", "category": "Food & Dining", "subcategory": "Food Delivery"},
    {"text": "FoodPanda order online meal delivery", "category": "Food & Dining", "subcategory": "Food Delivery"},
    {"text": "SM Supermarket  grocery shopping", "category": "Groceries", "subcategory": "Supermarket"},
    {"text": "Rustan's Supermarket Ayala grocery", "category": "Groceries", "subcategory": "Supermarket"},
    {"text": "Robinsons Supermarket Magnolia grocery items", "category": "Groceries", "subcategory": "Supermarket"},
    {"text": "Puregold  supermarket groceries", "category": "Groceries", "subcategory": "Supermarket"},
    {"text": "S&R Membership Shopping Bicutan bulk grocery", "category": "Groceries", "subcategory": "Warehouse Club"},
    {"text": "Landers Superstore Pasay bulk goods", "category": "Groceries", "subcategory": "Warehouse Club"},
    {"text": "Walter Mart supermarket grocery ", "category": "Groceries", "subcategory": "Supermarket"},
    {"text": "Grab car booking  to BGC", "category": "Transportation", "subcategory": "Rideshare"},
    {"text": "Angkas motorcycle  fare", "category": "Transportation", "subcategory": "Rideshare"},
    {"text": "InDriver trip booking Metro Manila", "category": "Transportation", "subcategory": "Rideshare"},
    {"text": "Petron gasoline station fuel fill-up ", "category": "Transportation", "subcategory": "Fuel"},
    {"text": "Shell station EDSA petroleum fuel", "category": "Transportation", "subcategory": "Fuel"},
    {"text": "Caltex  Ave gasoline diesel", "category": "Transportation", "subcategory": "Fuel"},
    {"text": "SM ecoSystem parking fee ", "category": "Transportation", "subcategory": "Parking"},
    {"text": "LRT BEEP card load MRT transit", "category": "Transportation", "subcategory": "Transit"},
    {"text": "Zara Greenbelt fashion clothing purchase", "category": "Shopping", "subcategory": "Clothing"},
    {"text": "H&M SM  apparel clothes", "category": "Shopping", "subcategory": "Clothing"},
    {"text": "Uniqlo Ayala clothing purchase", "category": "Shopping", "subcategory": "Clothing"},
    {"text": "National Bookstore school office supplies", "category": "Shopping", "subcategory": "Books & Supplies"},
    {"text": "Fully Booked BGC books novels", "category": "Shopping", "subcategory": "Books & Supplies"},
    {"text": "SM Department Store  homeware", "category": "Shopping", "subcategory": "Department Store"},
    {"text": "Robinsons Department Store Ermita purchase", "category": "Shopping", "subcategory": "Department Store"},
    {"text": "Lazada online shopping purchase", "category": "Shopping", "subcategory": "Online Shopping"},
    {"text": "Shopee mall purchase delivery online", "category": "Shopping", "subcategory": "Online Shopping"},
    {"text": "Nike SM  shoes sneakers", "category": "Shopping", "subcategory": "Footwear"},
    {"text": "Adidas Glorietta sports shoes", "category": "Shopping", "subcategory": "Footwear"},
    {"text": "SM Cinema  movie tickets", "category": "Entertainment", "subcategory": "Cinema"},
    {"text": "Netflix subscription streaming monthly", "category": "Entertainment", "subcategory": "Streaming"},
    {"text": "Spotify premium music streaming subscription", "category": "Entertainment", "subcategory": "Streaming"},
    {"text": "Timezone arcade SM  games", "category": "Entertainment", "subcategory": "Arcade"},
    {"text": "Oxygen Bar karaoke  Ave nightlife", "category": "Entertainment", "subcategory": "Nightlife"},
    {"text": "Watsons pharmacy medicine vitamins ", "category": "Health & Wellness", "subcategory": "Pharmacy"},
    {"text": "Mercury Drug pharmacy prescription ", "category": "Health & Wellness", "subcategory": "Pharmacy"},
    {"text": "St. Luke's Medical Center consultation fee", "category": "Health & Wellness", "subcategory": "Medical"},
    {"text": "Medical Center hospital laboratory", "category": "Health & Wellness", "subcategory": "Medical"},
    {"text": "Anytime Fitness", "category": "Health & Wellness", "subcategory": "Gym"},
    {"text": "Gold's Gym  fitness subscription", "category": "Health & Wellness", "subcategory": "Gym"},
    {"text": "The Spa Greenbelt wellness massage", "category": "Health & Wellness", "subcategory": "Wellness"},
    {"text": "Meralco", "category": "Bills & Utilities", "subcategory": "Electricity"},
    {"text": "Maynilad", "category": "Bills & Utilities", "subcategory": "Water"},
    {"text": "PLDT Fibr internet monthly bill", "category": "Bills & Utilities", "subcategory": "Internet"},
    {"text": "Globe Telecom postpaid mobile bill", "category": "Bills & Utilities", "subcategory": "Mobile"},
    {"text": "Smart Communications mobile plan payment", "category": "Bills & Utilities", "subcategory": "Mobile"},
    {"text": "SkyCable TV subscription cable", "category": "Bills & Utilities", "subcategory": "Cable TV"},
    {"text": "Converge ICT fiber internet ", "category": "Bills & Utilities", "subcategory": "Internet"},
    {"text": "Philippine Airlines", "category": "Travel", "subcategory": "Flights"},
    {"text": "Cebu Pacific airline ticket booking", "category": "Travel", "subcategory": "Flights"},
    {"text": "Airbnb", "category": "Travel", "subcategory": "Accommodation"},
    {"text": "Booking.com", "category": "Travel", "subcategory": "Accommodation"},
    {"text": "Agoda hotel booking Boracay resort", "category": "Travel", "subcategory": "Accommodation"},
    {"text": "Udemy", "category": "Education", "subcategory": "Online Course"},
    {"text": "Coursera", "category": "Education", "subcategory": "Online Course"},
    {"text": "PowerBooks textbook school supplies", "category": "Education", "subcategory": "Books"},
]


class RAGService:
    def __init__(self):
        self.client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)

        self.collection = settings.qdrant_collection
        self._initialized = False

    async def initialize(self):
        """Create collection and seed with category examples."""
        texts = [ex["text"] for ex in CATEGORY_EXAMPLES]
        collection_info = None
        try:
            collection_info = self.client.get_collection(self.collection)
        except Exception:
            pass

        if collection_info is not None:
            vector = await self._embed_one(texts[0])
            vector_config = collection_info.config.params.vectors
            if getattr(vector_config, "size", None) == len(vector):
                logger.info(f"QDrant collection '{self.collection}' already exists.")
                self._initialized = True
                return

            legacy_collection = self.collection
            self.collection = f"{legacy_collection}_{len(vector)}"
            try:
                collection_info = self.client.get_collection(self.collection)
            except Exception:
                collection_info = None

            if collection_info is not None:
                vector_config = collection_info.config.params.vectors
                if getattr(vector_config, "size", None) != len(vector):
                    raise ValueError(
                        f"QDrant collection '{self.collection}' has an incompatible vector size."
                    )
                logger.info(f"Using dimension-compatible QDrant collection '{self.collection}'.")
                self._initialized = True
                return

            logger.info(
                f"Existing QDrant collection '{legacy_collection}' has a different embedding dimension; "
                f"creating '{self.collection}'."
            )

        embeddings = await self._embed_batch(texts)
        if not embeddings:
            raise ValueError("The embedding backend returned no vectors.")

        logger.info(f"Creating QDrant collection '{self.collection}'...")
        self.client.create_collection(
            collection_name=self.collection,
            vectors_config=VectorParams(size=len(embeddings[0]), distance=Distance.COSINE),
        )

        points = [
            PointStruct(
                id=i,
                vector=embeddings[i],
                payload={
                    "text": CATEGORY_EXAMPLES[i]["text"],
                    "category": CATEGORY_EXAMPLES[i]["category"],
                    "subcategory": CATEGORY_EXAMPLES[i]["subcategory"],
                },
            )
            for i in range(len(CATEGORY_EXAMPLES))
        ]
        self.client.upsert(collection_name=self.collection, points=points)
        logger.info(f"Seeded {len(points)} examples into QDrant.")
        self._initialized = True

    async def _embed_batch(self, texts: List[str]) -> List[List[float]]:
        return await llm_client.embed(texts)

    async def _embed_one(self, text: str) -> List[float]:
        embeddings = await self._embed_batch([text])
        return embeddings[0]

    async def search(self, query: str, top_k: int = 3) -> List[dict]:
        vector = await self._embed_one(query)
        results = self.client.query_points(
            collection_name=self.collection,
            query=vector,
            limit=top_k,
            with_payload=True,
        ).points
        return [
            {
                "text": r.payload["text"],
                "category": r.payload["category"],
                "subcategory": r.payload["subcategory"],
                "score": r.score,
            }
            for r in results
        ]


rag_service = RAGService()
