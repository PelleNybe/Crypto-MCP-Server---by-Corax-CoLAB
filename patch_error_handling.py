import re

with open('autonomous_orchestrator.py', 'r') as f:
    content = f.read()

old_except = """        except Exception as e:
            logger.error(f"Error during agent loop cycle: {e}", exc_info=True)

        logger.info(f"Cycle complete. Waiting for {loop_interval_minutes} minutes...")
        await asyncio.sleep(loop_interval_minutes * 60)"""

new_except = """        except Exception as e:
            logger.error(f"Critical error during agent loop cycle: {e}", exc_info=True)
            if telegram_mgr:
                try:
                    await telegram_mgr.send_telegram_alert(f"⚠️ Critical Error in Agent Loop: {e}")
                except Exception as tg_e:
                    logger.error(f"Failed to send Telegram error alert: {tg_e}")

        logger.info(f"Cycle complete. Waiting for {loop_interval_minutes} minutes...")
        await asyncio.sleep(loop_interval_minutes * 60)"""

content = content.replace(old_except, new_except)

with open('autonomous_orchestrator.py', 'w') as f:
    f.write(content)
