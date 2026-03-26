import requests
import sys
import json
from datetime import datetime

class VerbaEdgeAPITester:
    def __init__(self, base_url="https://verbaedge-demo.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.interview_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        
        if success:
            required_fields = ['status', 'timestamp', 'vapi_configured', 'clerk_configured']
            for field in required_fields:
                if field not in response:
                    print(f"⚠️  Warning: Missing field '{field}' in health response")
                    return False
            
            if response.get('status') != 'healthy':
                print(f"⚠️  Warning: Health status is '{response.get('status')}', expected 'healthy'")
                return False
                
            print(f"   VAPI Configured: {response.get('vapi_configured')}")
            print(f"   Clerk Configured: {response.get('clerk_configured')}")
        
        return success

    def test_config_endpoint(self):
        """Test config endpoint"""
        success, response = self.run_test(
            "Config Endpoint",
            "GET",
            "config",
            200
        )
        
        if success:
            required_fields = ['vapi_public_key', 'clerk_publishable_key']
            for field in required_fields:
                if field not in response:
                    print(f"⚠️  Warning: Missing field '{field}' in config response")
                    return False
            
            # Check if keys are not empty
            if not response.get('vapi_public_key'):
                print("⚠️  Warning: VAPI public key is empty")
            if not response.get('clerk_publishable_key'):
                print("⚠️  Warning: Clerk publishable key is empty")
                
            print(f"   VAPI Public Key: {response.get('vapi_public_key')[:20]}...")
            print(f"   Clerk Publishable Key: {response.get('clerk_publishable_key')[:20]}...")
        
        return success

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        
        if success and 'message' not in response:
            print("⚠️  Warning: Root endpoint should return a message")
            return False
            
        return success

    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints require authentication"""
        protected_endpoints = [
            ("interviews", "GET"),
            ("interviews", "POST"),
            ("user/profile", "GET"),
            ("user/stats", "GET")
        ]
        
        all_passed = True
        for endpoint, method in protected_endpoints:
            success, _ = self.run_test(
                f"Protected {endpoint} without auth",
                method,
                endpoint,
                401,
                data={"test": "data"} if method == "POST" else None
            )
            if not success:
                all_passed = False
        
        return all_passed

    def test_interview_creation_without_auth(self):
        """Test interview creation without authentication"""
        interview_data = {
            "job_role": "Software Engineer",
            "interview_type": "behavioral",
            "interviewer_mode": "neutral",
            "difficulty": "medium"
        }
        
        success, _ = self.run_test(
            "Create Interview without Auth",
            "POST",
            "interviews",
            401,
            data=interview_data
        )
        
        return success

    def test_invalid_endpoints(self):
        """Test invalid endpoints return 404"""
        invalid_endpoints = [
            "nonexistent",
            "interviews/invalid-id",
            "user/invalid"
        ]
        
        all_passed = True
        for endpoint in invalid_endpoints:
            success, _ = self.run_test(
                f"Invalid endpoint: {endpoint}",
                "GET",
                endpoint,
                404
            )
            # Note: Some endpoints might return 401 instead of 404 due to auth middleware
            # So we'll accept both 404 and 401 as valid responses
            if not success:
                # Try again expecting 401
                success, _ = self.run_test(
                    f"Invalid endpoint: {endpoint} (expecting 401)",
                    "GET",
                    endpoint,
                    401
                )
            
            if not success:
                all_passed = False
        
        return all_passed

    def test_cors_headers(self):
        """Test CORS headers are present"""
        try:
            response = requests.options(f"{self.api_url}/health", timeout=10)
            
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            print(f"\n🔍 Testing CORS Headers...")
            print(f"   Status: {response.status_code}")
            
            missing_headers = []
            for header in cors_headers:
                if header not in response.headers:
                    missing_headers.append(header)
                else:
                    print(f"   {header}: {response.headers[header]}")
            
            if missing_headers:
                print(f"⚠️  Warning: Missing CORS headers: {missing_headers}")
                return False
            
            print("✅ CORS headers present")
            return True
            
        except Exception as e:
            print(f"❌ CORS test failed: {e}")
            return False

def main():
    """Run all backend API tests"""
    print("🚀 Starting VerbaEdge Backend API Tests")
    print("=" * 50)
    
    tester = VerbaEdgeAPITester()
    
    # Test basic endpoints
    print("\n📋 Testing Basic Endpoints...")
    tester.test_root_endpoint()
    tester.test_health_endpoint()
    tester.test_config_endpoint()
    
    # Test authentication requirements
    print("\n🔒 Testing Authentication Requirements...")
    tester.test_protected_endpoints_without_auth()
    tester.test_interview_creation_without_auth()
    
    # Test invalid endpoints
    print("\n❌ Testing Invalid Endpoints...")
    tester.test_invalid_endpoints()
    
    # Test CORS
    print("\n🌐 Testing CORS Configuration...")
    tester.test_cors_headers()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())