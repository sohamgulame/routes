from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import math
import datetime

from app.ml_model import pipeline

app = FastAPI(
    title="AURA-NER AI & Hazard Analytics Microservice",
    description="Predictive Disruption Engine, XGBoost Hazard Inference, SHAP Explainability & Perishable Shelf-Life Analytics for North Eastern Region",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Pydantic Request & Response Models
# ---------------------------------------------------------
class SegmentRiskRequest(BaseModel):
    segmentId: str
    rainfall24h: float = Field(default=0.0, description="Rainfall in last 24h (mm)")
    rainfall48h: float = Field(default=0.0, description="Cumulative rainfall in last 48h (mm)")
    slopeAngleDeg: float = Field(default=15.0, description="Average terrain slope (degrees)")
    soilMoistureIndex: float = Field(default=0.5, description="Soil moisture saturation (0.0 - 1.0)")
    elevationAvgM: float = Field(default=600.0, description="Average elevation (meters)")
    historicalLandslides: int = Field(default=0, description="Past incident count")
    bridgeCount: int = Field(default=0, description="Number of bridges on segment")

class ShapFactor(BaseModel):
    factor: str
    impactScore: float
    actualValue: float
    description: str

class SegmentRiskResponse(BaseModel):
    segmentId: str
    riskProbability: float
    riskLevel: str # LOW, MEDIUM, HIGH, CRITICAL
    isPassable: bool
    recommendedAction: str
    topRiskFactors: List[ShapFactor]
    plainLanguageJustification: str
    calculatedAt: str

class PerishableDecayRequest(BaseModel):
    commodityName: str
    initialFreshnessHours: float
    transitElapsedHours: float
    currentTemperatureCelsius: float
    optimalTemperatureCelsius: float = 4.0

class PerishableDecayResponse(BaseModel):
    commodityName: str
    freshnessIndex: float # 0.0 to 1.0 (1.0 = 100% Fresh)
    remainingFreshnessHours: float
    isSpoiled: bool
    spoilageRiskTier: str

# ---------------------------------------------------------
# REST API Endpoints
# ---------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "AURA-NER AI Microservice",
        "xgboostLoaded": pipeline.model is not None,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.post("/api/predict-risk", response_model=SegmentRiskResponse)
def predict_segment_risk(req: SegmentRiskRequest):
    result = pipeline.predict_hazard(req.model_dump())
    return SegmentRiskResponse(
        segmentId=req.segmentId,
        riskProbability=result["riskProbability"],
        riskLevel=result["riskLevel"],
        isPassable=result["isPassable"],
        recommendedAction=result["recommendedAction"],
        topRiskFactors=[ShapFactor(**f) for f in result["topRiskFactors"]],
        plainLanguageJustification=result["plainLanguageJustification"],
        calculatedAt=datetime.datetime.utcnow().isoformat()
    )

@app.post("/api/predict-risk-batch", response_model=List[SegmentRiskResponse])
def predict_risk_batch(requests: List[SegmentRiskRequest]):
    responses = []
    for req in requests:
        result = pipeline.predict_hazard(req.model_dump())
        responses.append(SegmentRiskResponse(
            segmentId=req.segmentId,
            riskProbability=result["riskProbability"],
            riskLevel=result["riskLevel"],
            isPassable=result["isPassable"],
            recommendedAction=result["recommendedAction"],
            topRiskFactors=[ShapFactor(**f) for f in result["topRiskFactors"]],
            plainLanguageJustification=result["plainLanguageJustification"],
            calculatedAt=datetime.datetime.utcnow().isoformat()
        ))
    return responses

@app.post("/api/decay-estimate", response_model=PerishableDecayResponse)
def estimate_perishable_decay(req: PerishableDecayRequest):
    # Arrhenius temperature acceleration model for crop/medicine spoilage
    # Q10 temperature coefficient approximation (spoilage rate doubles every 10°C above optimal)
    delta_t = max(0.0, req.currentTemperatureCelsius - req.optimalTemperatureCelsius)
    temp_acceleration_factor = math.pow(2.0, delta_t / 10.0)

    effective_elapsed_hours = req.transitElapsedHours * temp_acceleration_factor
    remaining_hours = max(0.0, req.initialFreshnessHours - effective_elapsed_hours)
    freshness_index = round(remaining_hours / req.initialFreshnessHours, 3)

    if freshness_index > 0.70:
        tier = "FRESH"
    elif freshness_index > 0.35:
        tier = "MODERATE_DECAY"
    elif freshness_index > 0.0:
        tier = "CRITICAL_SPOILAGE_WARNING"
    else:
        tier = "SPOILED"

    return PerishableDecayResponse(
        commodityName=req.commodityName,
        freshnessIndex=freshness_index,
        remainingFreshnessHours=round(remaining_hours, 1),
        isSpoiled=freshness_index <= 0.0,
        spoilageRiskTier=tier
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
