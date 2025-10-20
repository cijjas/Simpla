"""
Example script to schedule the weekly digest to run automatically every Friday.

This script can be run as a separate service or integrated into the main application.

Requirements:
    pip install apscheduler httpx
"""

import asyncio
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = "http://localhost:8000"  # Change for production
DIGEST_ENDPOINT = f"{BACKEND_URL}/api/digest/trigger/"


async def trigger_weekly_digest():
    """
    Trigger the weekly digest generation by calling the API endpoint.
    """
    try:
        logger.info("Triggering weekly digest generation...")
        
        async with httpx.AsyncClient(timeout=600.0) as client:  # 10 minute timeout
            response = await client.post(DIGEST_ENDPOINT, json={})
            
            if response.status_code == 200:
                data = response.json()
                logger.info(
                    f"✅ Digest generated successfully! "
                    f"Normas: {data.get('total_normas', 0)}, "
                    f"Emails sent: {data.get('emails_sent', 0)}"
                )
            else:
                logger.error(
                    f"❌ Failed to generate digest. "
                    f"Status: {response.status_code}, "
                    f"Response: {response.text}"
                )
    except Exception as e:
        logger.error(f"❌ Error triggering digest: {str(e)}", exc_info=True)


async def main():
    """
    Set up the scheduler and keep it running.
    """
    logger.info("🚀 Starting Weekly Digest Scheduler")
    
    scheduler = AsyncIOScheduler()
    
    # Schedule to run every Friday at 6 PM (18:00)
    scheduler.add_job(
        trigger_weekly_digest,
        'cron',
        day_of_week='fri',
        hour=18,
        minute=0,
        timezone='America/Argentina/Buenos_Aires'  # Adjust timezone as needed
    )
    
    logger.info("📅 Scheduled weekly digest for every Friday at 18:00 (Argentina time)")
    
    # Optionally: trigger immediately on startup for testing
    # await trigger_weekly_digest()
    
    scheduler.start()
    logger.info("✅ Scheduler started successfully")
    
    # Keep the script running
    try:
        while True:
            await asyncio.sleep(60)  # Sleep for 60 seconds
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Shutting down scheduler...")
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())

