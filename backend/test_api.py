import sys
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from seed import main as seed_db

client = TestClient(app)

class TestAuthAndEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Seed database before running tests
        seed_db()

    def test_01_login_admin(self):
        res = client.post("/api/v1/auth/login", json={
            "email": "admin@carbonmrv.io",
            "password": "admin123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access_token", data)
        self.assertIn("refresh_token", data)
        self.assertEqual(data["token_type"], "bearer")

    def test_02_login_invalid_password(self):
        res = client.post("/api/v1/auth/login", json={
            "email": "admin@carbonmrv.io",
            "password": "wrongpassword"
        })
        self.assertEqual(res.status_code, 401)

    def test_03_me_endpoint(self):
        login_res = client.post("/api/v1/auth/login", json={
            "email": "ravi.sharma@sundarbans-ngo.org",
            "password": "owner123"
        })
        token = login_res.json()["access_token"]
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], "ravi.sharma@sundarbans-ngo.org")
        self.assertEqual(data["role"], "PROJECT_OWNER")

    def test_04_register_and_login(self):
        import uuid
        email = f"user_{uuid.uuid4().hex[:8]}@test.com"
        reg_res = client.post("/api/v1/auth/register", json={
            "email": email,
            "password": "newpassword123",
            "name": "New Test User",
            "role": "USER"
        })
        self.assertEqual(reg_res.status_code, 201)
        self.assertIn("access_token", reg_res.json())

        login_res = client.post("/api/v1/auth/login", json={
            "email": email,
            "password": "newpassword123"
        })
        self.assertEqual(login_res.status_code, 200)

    def test_05_refresh_token(self):
        login_res = client.post("/api/v1/auth/login", json={
            "email": "admin@carbonmrv.io",
            "password": "admin123"
        })
        refresh_token = login_res.json()["refresh_token"]

        ref_res = client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        self.assertEqual(ref_res.status_code, 200)
        self.assertIn("access_token", ref_res.json())

    def test_06_get_projects_public(self):
        res = client.get("/api/v1/projects")
        self.assertEqual(res.status_code, 200)
        projects = res.json()
        self.assertGreaterEqual(len(projects), 3)

    def test_07_get_project_detail(self):
        res = client.get("/api/v1/projects/p-mangrove-001")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["project_name"], "Sundarbans Mangrove Restoration")

    def test_08_carbon_credits_public(self):
        res = client.get("/api/v1/carbon-credits")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total"], 2)

    def test_09_verify_credit_public(self):
        res = client.get("/api/v1/carbon-credits/verify/cc-001")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("credit", data)
        self.assertIn("project", data)

if __name__ == "__main__":
    unittest.main()
