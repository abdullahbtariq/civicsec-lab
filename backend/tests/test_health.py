from django.test import Client


def test_health_endpoint_returns_service_status():
    client = Client()

    response = client.get("/api/health/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "civicsec-backend"}
