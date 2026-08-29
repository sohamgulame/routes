import json
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    print("[PASS] /health passed:", data)

def test_predict_risk():
    payload = {
        "segmentId": "SEG-NH27-TEZPUR",
        "rainfall24h": 45.0,
        "rainfall48h": 120.0,
        "slopeAngleDeg": 32.5,
        "soilMoistureIndex": 0.85,
        "elevationAvgM": 750.0,
        "historicalLandslides": 3,
        "bridgeCount": 2
    }
    response = client.post("/api/predict-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "riskProbability" in data
    assert data["riskLevel"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert len(data["topRiskFactors"]) > 0
    print("[PASS] /api/predict-risk passed:", json.dumps(data, indent=2))

def test_decay_estimate():
    payload = {
        "commodityName": "Vaccines_Covaxin",
        "initialFreshnessHours": 72.0,
        "transitElapsedHours": 12.0,
        "currentTemperatureCelsius": 14.0,
        "optimalTemperatureCelsius": 4.0
    }
    response = client.post("/api/decay-estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "freshnessIndex" in data
    assert data["spoilageRiskTier"] in ["FRESH", "MODERATE_DECAY", "CRITICAL_SPOILAGE_WARNING", "SPOILED"]
    print("[PASS] /api/decay-estimate passed:", json.dumps(data, indent=2))

if __name__ == "__main__":
    print("--- Running AURA-NER AI Microservice Integration Tests ---")
    test_health()
    test_predict_risk()
    test_decay_estimate()
    print("--- All AI Tests Passed Successfully! ---")
