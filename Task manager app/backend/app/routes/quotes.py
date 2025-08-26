import json
import os
import random
from fastapi import APIRouter, HTTPException

router = APIRouter()
QUOTES_FILE = os.path.join(os.path.dirname(__file__), '..', 'quotes.json')

@router.get("/quote")
def get_random_quote():
    try:
        with open(QUOTES_FILE, 'r') as file:
            quotes = json.load(file)
        if not quotes:
            raise HTTPException(status_code=404, detail="No quotes found.")
        return {"quote": random.choice(quotes)}
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Quotes file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON format in quotes file.")
