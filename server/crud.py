from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.models import SKU, AssortmentDecision
from server.schemas import KPISchema, SKUPerformanceItem, SKUPerformanceResponse, ScenarioResponse, AssortmentSubmitRequest
import uuid

def get_sku_status(growth: float) -> str:
    if growth is None:
        return "MAINTAIN"
    # Convert to float if it's Decimal
    growth_val = float(growth)
    if growth_val > 10.0:
        return "GROW"
    elif growth_val < -10.0:
        return "SWAP"
    elif growth_val < 0.0:
        return "REDUCE"
    else:
        return "MAINTAIN"

def get_kpis(db: Session) -> dict:
    total_skus = db.query(SKU).count()
    pb_skus = db.query(SKU).filter(SKU.private_brand == True).count()
    pb_pct = (pb_skus / total_skus * 100) if total_skus > 0 else 28.5
    
    return {
        "in_stock_rate": 96.2,
        "private_brand_pct": round(pb_pct, 1),
        "sales_per_linear_ft": 124.5,
        "shelf_capacity_pct": 82.0
    }

def get_skus_performance(db: Session, page: int = 1, limit: int = 10, search: str = None, status: str = None) -> dict:
    query = db.query(SKU)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(SKU.name.ilike(search_filter), SKU.category.ilike(search_filter)))
        
    all_items = query.all()
    
    # Filter by status if provided (since status is calculated dynamically)
    filtered_items = []
    for item in all_items:
        item_status = get_sku_status(item.sales_growth_pct)
        if status and item_status.upper() != status.upper():
            continue
        filtered_items.append(item)
        
    total = len(filtered_items)
    
    # Paginate
    start = (page - 1) * limit
    end = start + limit
    paginated_items = filtered_items[start:end]
    
    items_response = []
    for item in paginated_items:
        items_response.append({
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "private_brand": item.private_brand,
            "sales": float(item.sales) if item.sales is not None else 0.0,
            "sales_growth_pct": float(item.sales_growth_pct) if item.sales_growth_pct is not None else 0.0,
            "status": get_sku_status(item.sales_growth_pct)
        })
        
    return {
        "items": items_response,
        "limit": limit,
        "page": page,
        "total": total
    }

def get_scenario(db: Session, scenario_name: str) -> dict:
    name_lower = scenario_name.lower()
    
    # Fetch some real SKUs to populate actions
    skus = db.query(SKU).limit(5).all()
    sku_list = []
    for s in skus:
        sku_list.append({
            "sku_id": s.id,
            "sku_name": s.name,
            "action": get_sku_status(s.sales_growth_pct)
        })
        
    if name_lower == "conservative":
        return {
            "scenario_name": "Conservative",
            "projected_sales_lift_pct": 2.1,
            "projected_private_brand_pct": 25.5,
            "guardrails": {
                "private_brand_goal": "PASS",
                "shelf_capacity": "PASS"
            },
            "sku_actions": {
                "add_count": 2,
                "remove_count": 1,
                "actions": sku_list[:2] if len(sku_list) >= 2 else sku_list
            }
        }
    elif name_lower == "balanced":
        return {
            "scenario_name": "Balanced",
            "projected_sales_lift_pct": 5.2,
            "projected_private_brand_pct": 30.1,
            "guardrails": {
                "private_brand_goal": "PASS",
                "shelf_capacity": "PASS"
            },
            "sku_actions": {
                "add_count": 5,
                "remove_count": 3,
                "actions": sku_list[:3] if len(sku_list) >= 3 else sku_list
            }
        }
    elif name_lower == "aggressive":
        return {
            "scenario_name": "Aggressive",
            "projected_sales_lift_pct": 8.5,
            "projected_private_brand_pct": 34.2,
            "guardrails": {
                "private_brand_goal": "PASS",
                "shelf_capacity": "FAIL"
            },
            "sku_actions": {
                "add_count": 8,
                "remove_count": 5,
                "actions": sku_list[:4] if len(sku_list) >= 4 else sku_list
            }
        }
    else:
        return None

def create_assortment_decision(db: Session, request: AssortmentSubmitRequest) -> AssortmentDecision:
    # Convert Pydantic models to dicts for JSON storage
    sku_actions_dict = request.sku_actions.model_dump()
    # Convert UUIDs to strings in JSON
    for action in sku_actions_dict.get("actions", []):
        if isinstance(action.get("sku_id"), uuid.UUID):
            action["sku_id"] = str(action["sku_id"])
        elif isinstance(action.get("sku_id"), str):
            pass
            
    guardrail_status_dict = request.guardrail_status.model_dump()
    
    db_decision = AssortmentDecision(
        id=uuid.uuid4(),
        scenario_name=request.scenario_name,
        user_id=request.user_id,
        sku_actions=sku_actions_dict,
        guardrail_status=guardrail_status_dict
    )
    db.add(db_decision)
    db.commit()
    db.refresh(db_decision)
    return db_decision
