import requests
import sys
import json
from datetime import datetime

class CommerceAPITester:
    def __init__(self, base_url="https://just-ok-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'categories': [],
            'products': [],
            'customers': [],
            'orders': [],
            'stock_movements': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n=== TESTING HEALTH ENDPOINTS ===")
        
        # Test root endpoint
        self.run_test("Root endpoint", "GET", "", 200)
        
        # Test health endpoint
        self.run_test("Health check", "GET", "health", 200)

    def test_categories(self):
        """Test category CRUD operations"""
        print("\n=== TESTING CATEGORIES ===")
        
        # Create category
        category_data = {
            "name": "Électronique Test",
            "description": "Catégorie test pour électronique"
        }
        success, response = self.run_test("Create category", "POST", "categories", 200, category_data)
        if success and 'id' in response:
            category_id = response['id']
            self.created_ids['categories'].append(category_id)
            
            # Get all categories
            self.run_test("Get all categories", "GET", "categories", 200)
            
            # Get specific category
            self.run_test("Get category by ID", "GET", f"categories/{category_id}", 200)
            
            # Update category
            update_data = {"description": "Description mise à jour"}
            self.run_test("Update category", "PUT", f"categories/{category_id}", 200, update_data)
            
            return category_id
        return None

    def test_products(self, category_id=None):
        """Test product CRUD operations"""
        print("\n=== TESTING PRODUCTS ===")
        
        # Create product
        product_data = {
            "name": "iPhone 15 Test",
            "description": "Smartphone Apple iPhone 15",
            "price": 939.99,
            "cost_price": 700.00,
            "category_id": category_id,
            "sku": "IP15-TEST-001",
            "barcode": "1234567890123",
            "stock_quantity": 25,
            "min_stock_level": 5,
            "is_active": True
        }
        success, response = self.run_test("Create product", "POST", "products", 200, product_data)
        if success and 'id' in response:
            product_id = response['id']
            self.created_ids['products'].append(product_id)
            
            # Get all products
            self.run_test("Get all products", "GET", "products", 200)
            
            # Get products with filters
            self.run_test("Get products by category", "GET", "products", 200, params={"category_id": category_id})
            self.run_test("Search products", "GET", "products", 200, params={"search": "iPhone"})
            self.run_test("Get active products", "GET", "products", 200, params={"is_active": True})
            self.run_test("Get low stock products", "GET", "products", 200, params={"low_stock": True})
            
            # Get specific product
            self.run_test("Get product by ID", "GET", f"products/{product_id}", 200)
            
            # Get product by barcode
            self.run_test("Get product by barcode", "GET", f"products/barcode/{product_data['barcode']}", 200)
            
            # Update product
            update_data = {"stock_quantity": 30, "price": 949.99}
            self.run_test("Update product", "PUT", f"products/{product_id}", 200, update_data)
            
            return product_id
        return None

    def test_customers(self):
        """Test customer CRUD operations"""
        print("\n=== TESTING CUSTOMERS ===")
        
        # Create customer
        customer_data = {
            "name": "Jean Dupont Test",
            "email": "jean.dupont.test@email.com",
            "phone": "0123456789",
            "address": "123 Rue de la Paix",
            "city": "Paris",
            "postal_code": "75001"
        }
        success, response = self.run_test("Create customer", "POST", "customers", 200, customer_data)
        if success and 'id' in response:
            customer_id = response['id']
            self.created_ids['customers'].append(customer_id)
            
            # Get all customers
            self.run_test("Get all customers", "GET", "customers", 200)
            
            # Search customers
            self.run_test("Search customers", "GET", "customers", 200, params={"search": "Jean"})
            
            # Get specific customer
            self.run_test("Get customer by ID", "GET", f"customers/{customer_id}", 200)
            
            # Update customer
            update_data = {"phone": "0987654321"}
            self.run_test("Update customer", "PUT", f"customers/{customer_id}", 200, update_data)
            
            return customer_id
        return None

    def test_orders(self, product_id=None, customer_id=None):
        """Test order CRUD operations"""
        print("\n=== TESTING ORDERS ===")
        
        if not product_id:
            print("❌ Cannot test orders without product_id")
            return None
            
        # Create order
        order_data = {
            "customer_id": customer_id,
            "customer_name": "Jean Dupont Test",
            "items": [
                {
                    "product_id": product_id,
                    "product_name": "iPhone 15 Test",
                    "quantity": 2,
                    "unit_price": 939.99,
                    "total_price": 1879.98
                }
            ],
            "discount_amount": 50.0,
            "payment_method": "card"
        }
        success, response = self.run_test("Create order", "POST", "orders", 200, order_data)
        if success and 'id' in response:
            order_id = response['id']
            self.created_ids['orders'].append(order_id)
            
            # Get all orders
            self.run_test("Get all orders", "GET", "orders", 200)
            
            # Get orders with filters
            self.run_test("Get orders by status", "GET", "orders", 200, params={"status": "pending"})
            if customer_id:
                self.run_test("Get orders by customer", "GET", "orders", 200, params={"customer_id": customer_id})
            
            # Get specific order
            self.run_test("Get order by ID", "GET", f"orders/{order_id}", 200)
            
            # Update order status
            update_data = {"status": "processing"}
            self.run_test("Update order status", "PUT", f"orders/{order_id}", 200, update_data)
            
            # Update payment status
            payment_update = {"payment_status": "completed"}
            self.run_test("Update payment status", "PUT", f"orders/{order_id}", 200, payment_update)
            
            return order_id
        return None

    def test_stock_management(self, product_id=None):
        """Test stock management operations"""
        print("\n=== TESTING STOCK MANAGEMENT ===")
        
        if not product_id:
            print("❌ Cannot test stock without product_id")
            return
            
        # Create stock movement
        movement_data = {
            "product_id": product_id,
            "movement_type": "in",
            "quantity": 10,
            "reason": "Réapprovisionnement test"
        }
        success, response = self.run_test("Create stock movement", "POST", "stock/movements", 200, movement_data)
        if success and 'id' in response:
            self.created_ids['stock_movements'].append(response['id'])
        
        # Get all stock movements
        self.run_test("Get all stock movements", "GET", "stock/movements", 200)
        
        # Get stock movements for specific product
        self.run_test("Get product stock movements", "GET", "stock/movements", 200, params={"product_id": product_id})
        
        # Get low stock products
        self.run_test("Get low stock products", "GET", "stock/low", 200)

    def test_dashboard(self):
        """Test dashboard statistics"""
        print("\n=== TESTING DASHBOARD ===")
        
        self.run_test("Get dashboard stats", "GET", "dashboard/stats", 200)

    def cleanup(self):
        """Clean up created test data"""
        print("\n=== CLEANING UP TEST DATA ===")
        
        # Delete in reverse order to handle dependencies
        for order_id in self.created_ids['orders']:
            self.run_test(f"Delete order {order_id[:8]}", "DELETE", f"orders/{order_id}", 200)
            
        for product_id in self.created_ids['products']:
            self.run_test(f"Delete product {product_id[:8]}", "DELETE", f"products/{product_id}", 200)
            
        for customer_id in self.created_ids['customers']:
            self.run_test(f"Delete customer {customer_id[:8]}", "DELETE", f"customers/{customer_id}", 200)
            
        for category_id in self.created_ids['categories']:
            self.run_test(f"Delete category {category_id[:8]}", "DELETE", f"categories/{category_id}", 200)

def main():
    print("🚀 Starting Commerce Management API Tests")
    print("=" * 50)
    
    tester = CommerceAPITester()
    
    try:
        # Test basic endpoints
        tester.test_health_check()
        
        # Test CRUD operations
        category_id = tester.test_categories()
        product_id = tester.test_products(category_id)
        customer_id = tester.test_customers()
        order_id = tester.test_orders(product_id, customer_id)
        
        # Test stock management
        tester.test_stock_management(product_id)
        
        # Test dashboard
        tester.test_dashboard()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 FINAL RESULTS:")
        print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
        success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
        print(f"Success rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Excellent! Backend API is working well")
        elif success_rate >= 70:
            print("⚠️  Good, but some issues need attention")
        else:
            print("❌ Major issues detected in backend API")
            
        return 0 if success_rate >= 70 else 1
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1
    finally:
        # Always try to cleanup
        try:
            tester.cleanup()
        except:
            print("⚠️  Some cleanup operations failed")

if __name__ == "__main__":
    sys.exit(main())