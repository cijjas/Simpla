#!/usr/bin/env python3
"""
Test script for the weekly digest feature.

This script provides utilities to test digest generation, user preferences, and email sending.

Usage:
    python test-digest.py
"""

import asyncio
import sys
import os
from datetime import date, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from core.database.base import SessionLocal
from features.digest.digest_service import DigestService
from features.digest.digest_models import DigestUserPreferences, DigestWeekly
from features.auth.auth_models import User


def get_db():
    """Get database session."""
    return SessionLocal()


def get_current_week():
    """Get the current week's Monday and Friday."""
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    friday = monday + timedelta(days=4)
    return monday, friday


def get_last_week():
    """Get last week's Monday and Friday."""
    today = date.today()
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_friday = last_monday + timedelta(days=4)
    return last_monday, last_friday


async def test_digest_generation():
    """Test generating a weekly digest."""
    print("\n=== Testing Digest Generation ===\n")
    
    db = get_db()
    try:
        service = DigestService()
        
        # You can test with custom dates or use current week
        week_start, week_end = get_last_week()  # Use last week for testing
        print(f"Generating digest for week: {week_start} to {week_end}")
        
        digest = await service.generate_weekly_digest(
            db=db,
            custom_start=week_start,
            custom_end=week_end
        )
        
        print(f"\n✅ Digest generated successfully!")
        print(f"   ID: {digest.id}")
        print(f"   Week: {digest.week_start} to {digest.week_end}")
        print(f"   Total normas: {digest.total_normas}")
        print(f"\n--- Article Summary (first 500 chars) ---")
        print(digest.article_summary[:500] if digest.article_summary else "No summary")
        print("...\n")
        
        if digest.article_json:
            normas = digest.article_json.get('normas', [])
            print(f"--- Normas in digest: {len(normas)} ---")
            for i, norma in enumerate(normas[:3], 1):  # Show first 3
                print(f"{i}. {norma.get('tipo_norma')} {norma.get('numero')} - {norma.get('titulo', 'No title')}")
            if len(normas) > 3:
                print(f"   ... and {len(normas) - 3} more")
        
        return digest
    finally:
        db.close()


async def test_user_filtering():
    """Test user preference filtering."""
    print("\n=== Testing User Preference Filtering ===\n")
    
    db = get_db()
    try:
        service = DigestService()
        
        # Get a digest (or use the one from previous test)
        digest = db.query(DigestWeekly).order_by(DigestWeekly.week_start.desc()).first()
        
        if not digest or not digest.article_json:
            print("❌ No digest found. Run test_digest_generation first.")
            return
        
        normas = digest.article_json.get('normas', [])
        print(f"Total normas in digest: {len(normas)}")
        
        # Test different filter scenarios
        test_filters = [
            {
                "name": "Only LEYes",
                "filter": {"tipo_norma": ["LEY"]}
            },
            {
                "name": "Nacional jurisdiction",
                "filter": {"jurisdiccion": ["Nacional"]}
            },
            {
                "name": "LEY + DECRETO",
                "filter": {"tipo_norma": ["LEY", "DECRETO"]}
            },
            {
                "name": "No filters (all normas)",
                "filter": {}
            }
        ]
        
        for test in test_filters:
            filtered = service.filter_normas_for_user(test["filter"], normas)
            print(f"\n{test['name']}: {len(filtered)} normas")
            if filtered:
                for i, norma in enumerate(filtered[:2], 1):  # Show first 2
                    print(f"  {i}. {norma.get('tipo_norma')} {norma.get('numero')}")
                if len(filtered) > 2:
                    print(f"  ... and {len(filtered) - 2} more")
    finally:
        db.close()


async def test_email_preview():
    """Preview email that would be sent to a user."""
    print("\n=== Email Preview ===\n")
    
    db = get_db()
    try:
        # Get latest digest
        digest = db.query(DigestWeekly).order_by(DigestWeekly.week_start.desc()).first()
        
        if not digest or not digest.article_json:
            print("❌ No digest found. Run test_digest_generation first.")
            return
        
        normas = digest.article_json.get('normas', [])[:3]  # First 3 normas
        
        print(f"Week: {digest.week_start} to {digest.week_end}")
        print(f"Total normas: {len(digest.article_json.get('normas', []))}")
        print(f"\nPreview of normas to be sent:\n")
        
        for i, norma in enumerate(normas, 1):
            print(f"{i}. {norma.get('tipo_norma')} {norma.get('numero')}")
            print(f"   {norma.get('titulo', 'No title')}")
            print(f"   Summary: {norma.get('summary', 'No summary')[:150]}...")
            print()
        
        print("💡 To actually send emails, use the /api/digest/trigger/ endpoint")
    finally:
        db.close()


def test_user_preferences():
    """Test getting and setting user preferences."""
    print("\n=== Testing User Preferences ===\n")
    
    db = get_db()
    try:
        # Get a test user
        user = db.query(User).filter(User.email_verified == True).first()
        
        if not user:
            print("❌ No verified user found in database.")
            return
        
        print(f"Testing with user: {user.email}")
        
        # Get current preferences
        prefs = db.query(DigestUserPreferences).filter(
            DigestUserPreferences.user_id == user.id
        ).first()
        
        if prefs:
            print(f"\nCurrent preferences:")
            print(f"  {prefs.filter_options}")
        else:
            print("\nNo preferences set (will receive all normas)")
            
            # Create sample preferences
            sample_prefs = DigestUserPreferences(
                user_id=user.id,
                filter_options={
                    "tipo_norma": ["LEY", "DECRETO"],
                    "jurisdiccion": ["Nacional"]
                }
            )
            db.add(sample_prefs)
            db.commit()
            print("\n✅ Created sample preferences:")
            print(f"  {sample_prefs.filter_options}")
    finally:
        db.close()


def list_digests():
    """List all generated digests."""
    print("\n=== All Generated Digests ===\n")
    
    db = get_db()
    try:
        digests = db.query(DigestWeekly).order_by(DigestWeekly.week_start.desc()).all()
        
        if not digests:
            print("No digests found in database.")
            return
        
        print(f"Found {len(digests)} digests:\n")
        for i, digest in enumerate(digests, 1):
            print(f"{i}. Week {digest.week_start} to {digest.week_end}")
            print(f"   ID: {digest.id}")
            print(f"   Normas: {digest.total_normas}")
            print(f"   Created: {digest.created_at}")
            print()
    finally:
        db.close()


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("     WEEKLY DIGEST FEATURE TEST SUITE")
    print("=" * 60)
    
    try:
        # 1. List existing digests
        list_digests()
        
        # 2. Test digest generation
        await test_digest_generation()
        
        # 3. Test user filtering
        await test_user_filtering()
        
        # 4. Test user preferences
        test_user_preferences()
        
        # 5. Preview email
        await test_email_preview()
        
        print("\n" + "=" * 60)
        print("     ALL TESTS COMPLETED")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

