"""Comprehensive test suite for the normas feature."""

import sys
import os
from datetime import date
from typing import Optional

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
sys.path.insert(0, backend_dir)

from features.normas.normas_reconstructor import NormaReconstructor  # noqa: E402


class TestNormas:
    """Test class for normas functionality."""
    
    def __init__(self):
        self.reconstructor = NormaReconstructor()
        self.passed = 0
        self.failed = 0
        self.test_norma_id: Optional[int] = None
        self.test_infoleg_id: Optional[int] = None
    
    def log(self, message: str, success: bool = True):
        """Log a test result."""
        symbol = "✓" if success else "✗"
        print(f"{symbol} {message}")
        if success:
            self.passed += 1
        else:
            self.failed += 1
    
    def test_database_connection(self):
        """Test database connection."""
        print("\n--- Testing Database Connection ---")
        try:
            with self.reconstructor.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                    result = cur.fetchone()
                    if result[0] == 1:
                        self.log("Database connection successful")
                        return True
                    else:
                        self.log("Database connection failed - unexpected result", False)
                        return False
        except Exception as e:
            self.log(f"Database connection failed with error: {str(e)}", False)
            return False
    
    def test_search_normas_basic(self):
        """Test basic search functionality without filters."""
        print("\n--- Testing Basic Search ---")
        try:
            normas, total_count = self.reconstructor.search_normas(limit=5)
            self.log(f"Basic search works - found {len(normas)} normas out of {total_count} total")
            
            if normas:
                self.test_norma_id = normas[0]['id']
                self.test_infoleg_id = normas[0]['infoleg_id']
                self.log(f"Stored test norma ID: {self.test_norma_id} and infoleg_id: {self.test_infoleg_id}")
                return True
            else:
                self.log("No normas found in database", False)
                return False
        except Exception as e:
            self.log(f"Basic search failed with error: {str(e)}", False)
            return False
    
    def test_search_with_text(self):
        """Test search with text term."""
        print("\n--- Testing Text Search ---")
        try:
            normas, total_count = self.reconstructor.search_normas(
                search_term="ley",
                limit=10
            )
            self.log(f"Text search works - found {len(normas)} normas matching 'ley'")
            return True
        except Exception as e:
            self.log(f"Text search failed with error: {str(e)}", False)
            return False
    
    def test_search_with_filters(self):
        """Test search with various filters."""
        print("\n--- Testing Filtered Search ---")
        
        # First get filter options
        try:
            options = self.reconstructor.get_filter_options()
            self.log(f"Filter options retrieved - {len(options['jurisdicciones'])} jurisdictions, "
                    f"{len(options['tipos_norma'])} types, {len(options['clases_norma'])} classes, "
                    f"{len(options['estados'])} statuses")
        except Exception as e:
            self.log(f"Failed to get filter options: {str(e)}", False)
            return False
        
        # Test filter by jurisdiction if available
        if options['jurisdicciones']:
            try:
                test_jurisdiccion = options['jurisdicciones'][0]
                normas, total_count = self.reconstructor.search_normas(
                    jurisdiccion=test_jurisdiccion,
                    limit=10
                )
                self.log(f"Jurisdiction filter works - found {len(normas)} normas with jurisdiccion='{test_jurisdiccion}'")
            except Exception as e:
                self.log(f"Jurisdiction filter failed: {str(e)}", False)
                return False
        
        # Test filter by tipo_norma if available
        if options['tipos_norma']:
            try:
                test_tipo = options['tipos_norma'][0]
                normas, total_count = self.reconstructor.search_normas(
                    tipo_norma=test_tipo,
                    limit=10
                )
                self.log(f"Type filter works - found {len(normas)} normas with tipo_norma='{test_tipo}'")
            except Exception as e:
                self.log(f"Type filter failed: {str(e)}", False)
                return False
        
        # Test date filter
        try:
            normas, total_count = self.reconstructor.search_normas(
                sancion_desde=date(2020, 1, 1),
                sancion_hasta=date(2023, 12, 31),
                limit=10
            )
            self.log(f"Date filter works - found {len(normas)} normas between 2020-2023")
        except Exception as e:
            self.log(f"Date filter failed: {str(e)}", False)
            return False
        
        # Test combined filters
        if options['estados'] and options['tipos_norma']:
            try:
                test_estado = options['estados'][0]
                test_tipo = options['tipos_norma'][0]
                normas, total_count = self.reconstructor.search_normas(
                    tipo_norma=test_tipo,
                    estado=test_estado,
                    limit=10
                )
                self.log(f"Combined filters work - found {len(normas)} normas with multiple filters")
            except Exception as e:
                self.log(f"Combined filters failed: {str(e)}", False)
                return False
        
        return True
    
    def test_pagination(self):
        """Test pagination functionality."""
        print("\n--- Testing Pagination ---")
        try:
            # Get first page
            page1, total = self.reconstructor.search_normas(limit=5, offset=0)
            # Get second page
            page2, _ = self.reconstructor.search_normas(limit=5, offset=5)
            
            if page1 and page2:
                # Check that pages are different
                page1_ids = {n['id'] for n in page1}
                page2_ids = {n['id'] for n in page2}
                overlap = page1_ids & page2_ids
                
                if not overlap:
                    self.log(f"Pagination works - page 1 ({len(page1)} items) and page 2 ({len(page2)} items) are different")
                    return True
                else:
                    self.log(f"Pagination issue - {len(overlap)} items overlap between pages", False)
                    return False
            else:
                self.log("Not enough normas to test pagination")
                return True
        except Exception as e:
            self.log(f"Pagination test failed: {str(e)}", False)
            return False
    
    def test_get_norma_summary(self):
        """Test getting norma summary."""
        print("\n--- Testing Norma Summary ---")
        
        if not self.test_norma_id:
            self.log("No test norma ID available, skipping summary test")
            return True
        
        try:
            summary = self.reconstructor.get_norma_summary(self.test_norma_id)
            if summary:
                self.log(f"Norma summary retrieved successfully for ID {self.test_norma_id}")
                self.log(f"  - Title: {summary.get('titulo_resumido', 'N/A')[:50]}...")
                self.log(f"  - Jurisdiction: {summary.get('jurisdiccion', 'N/A')}")
                self.log(f"  - Type: {summary.get('tipo_norma', 'N/A')}")
                return True
            else:
                self.log(f"Failed to retrieve norma summary for ID {self.test_norma_id}", False)
                return False
        except Exception as e:
            self.log(f"Norma summary test failed: {str(e)}", False)
            return False
    
    def test_get_norma_by_infoleg_id(self):
        """Test getting norma by infoleg_id."""
        print("\n--- Testing Get by Infoleg ID ---")
        
        if not self.test_infoleg_id:
            self.log("No test infoleg ID available, skipping test")
            return True
        
        try:
            norma = self.reconstructor.get_norma_by_infoleg_id(self.test_infoleg_id)
            if norma:
                self.log(f"Norma retrieved successfully by infoleg_id {self.test_infoleg_id}")
                return True
            else:
                self.log(f"Failed to retrieve norma by infoleg_id {self.test_infoleg_id}", False)
                return False
        except Exception as e:
            self.log(f"Get by infoleg_id test failed: {str(e)}", False)
            return False
    
    def test_reconstruct_norma(self):
        """Test full norma reconstruction."""
        print("\n--- Testing Full Norma Reconstruction ---")
        
        if not self.test_norma_id:
            self.log("No test norma ID available, skipping reconstruction test")
            return True
        
        try:
            norma = self.reconstructor.reconstruct_norma(self.test_norma_id)
            if norma:
                self.log(f"Norma reconstruction works - reconstructed norma {self.test_norma_id}")
                self.log(f"  - Title: {norma.titulo_resumido[:50] if norma.titulo_resumido else 'N/A'}...")
                self.log(f"  - Divisions: {len(norma.divisions)}")
                
                # Count total articles
                total_articles = 0
                for division in norma.divisions:
                    total_articles += len(division.articles)
                    # Also count nested articles
                    for article in division.articles:
                        total_articles += len(article.child_articles)
                
                self.log(f"  - Total articles: {total_articles}")
                
                # Test hierarchical structure
                if norma.divisions:
                    first_div = norma.divisions[0]
                    self.log(f"  - First division: '{first_div.name or first_div.title or 'N/A'}' "
                            f"with {len(first_div.articles)} articles and {len(first_div.child_divisions)} sub-divisions")
                
                return True
            else:
                self.log(f"Failed to reconstruct norma {self.test_norma_id}", False)
                return False
        except Exception as e:
            self.log(f"Norma reconstruction failed: {str(e)}", False)
            return False
    
    def test_get_filter_options(self):
        """Test getting filter options."""
        print("\n--- Testing Filter Options ---")
        try:
            options = self.reconstructor.get_filter_options()
            
            self.log(f"Filter options retrieved successfully")
            if options['jurisdicciones']:
                self.log(f"  - Jurisdictions: {len(options['jurisdicciones'])} "
                        f"({', '.join(options['jurisdicciones'][:3])}...)")
            else:
                self.log("  - Jurisdictions: 0")
            
            if options['tipos_norma']:
                self.log(f"  - Norma types: {len(options['tipos_norma'])} "
                        f"({', '.join(options['tipos_norma'][:3])}...)")
            else:
                self.log("  - Norma types: 0")
            
            if options['clases_norma']:
                self.log(f"  - Norma classes: {len(options['clases_norma'])} "
                        f"({', '.join(options['clases_norma'][:3])}...)")
            else:
                self.log("  - Norma classes: 0")
            
            if options['estados']:
                self.log(f"  - Statuses: {len(options['estados'])} "
                        f"({', '.join(options['estados'][:3])}...)")
            else:
                self.log("  - Statuses: 0")
            
            return True
        except Exception as e:
            self.log(f"Filter options test failed: {str(e)}", False)
            return False
    
    def test_invalid_norma_id(self):
        """Test handling of invalid norma ID."""
        print("\n--- Testing Invalid Norma ID Handling ---")
        try:
            norma = self.reconstructor.reconstruct_norma(999999999)
            if norma is None:
                self.log("Invalid norma ID handled correctly (returned None)")
                return True
            else:
                self.log("Invalid norma ID not handled correctly", False)
                return False
        except Exception as e:
            self.log(f"Invalid norma ID test failed: {str(e)}", False)
            return False
    
    def run_all_tests(self):
        """Run all tests."""
        print("=" * 70)
        print("RUNNING COMPREHENSIVE NORMAS FEATURE TESTS")
        print("=" * 70)
        
        # Run tests in order
        tests = [
            self.test_database_connection,
            self.test_search_normas_basic,
            self.test_search_with_text,
            self.test_search_with_filters,
            self.test_pagination,
            self.test_get_filter_options,
            self.test_get_norma_summary,
            self.test_get_norma_by_infoleg_id,
            self.test_reconstruct_norma,
            self.test_invalid_norma_id,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log(f"{test.__name__} crashed with exception: {str(e)}", False)
        
        # Print summary
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        print(f"Passed: {self.passed}")
        print(f"Failed: {self.failed}")
        print(f"Total:  {self.passed + self.failed}")
        
        if self.failed == 0:
            print("\n🎉 ALL TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️  {self.failed} TEST(S) FAILED")
            return False


def main():
    """Main test function."""
    test_suite = TestNormas()
    success = test_suite.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
