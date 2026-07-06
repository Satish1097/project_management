from django.test import TestCase
from django.urls import reverse


class HealthEndpointTests(TestCase):
    def test_health_endpoint_returns_standard_shape(self):
        response = self.client.get(reverse("health-check"))
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body["success"])
        self.assertIn("status", body["data"])
        self.assertIn("database", body["data"])
        self.assertIn("redis", body["data"])
