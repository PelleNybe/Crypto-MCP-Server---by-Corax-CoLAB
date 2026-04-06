import os
import glob
import logging
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

logger = logging.getLogger("TelegramManager")

class TelegramManager:
    def __init__(self, get_status_callback, get_latest_report_callback, trigger_analyze_callback):
        self.enabled = os.getenv("TELEGRAM_NOTIFICATIONS_ENABLED", "false").lower() == "true"
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")

        self.get_status_callback = get_status_callback
        self.get_latest_report_callback = get_latest_report_callback
        self.trigger_analyze_callback = trigger_analyze_callback

        self.app = None
        if self.enabled and self.bot_token and self.chat_id:
            try:
                self.app = ApplicationBuilder().token(self.bot_token).build()

                # Register commands
                self.app.add_handler(CommandHandler("status", self.handle_status))
                self.app.add_handler(CommandHandler("report", self.handle_report))
                self.app.add_handler(CommandHandler("analyze", self.handle_analyze))
            except Exception as e:
                logger.error(f"Failed to initialize Telegram Application: {e}")
                self.app = None
        else:
            logger.info("Telegram integration is disabled or missing credentials.")

    async def start(self):
        """Starts the Telegram bot listening in the background."""
        if self.app:
            logger.info("Starting Telegram Bot listener...")
            try:
                await self.app.initialize()
                await self.app.start()
                await self.app.updater.start_polling()
            except Exception as e:
                logger.error(f"Error starting Telegram polling: {e}")

    async def send_telegram_alert(self, message: str):
        """Sends an outbound alert to the configured chat_id."""
        if not self.app or not self.chat_id:
            return

        try:
            await self.app.bot.send_message(chat_id=self.chat_id, text=message)
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")

    async def handle_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        status_info = await self.get_status_callback()
        await update.message.reply_text(status_info)

    async def handle_report(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        report_path = await self.get_latest_report_callback()
        if report_path and os.path.exists(report_path):
            try:
                with open(report_path, "rb") as f:
                    await update.message.reply_document(document=f, filename=os.path.basename(report_path))
            except Exception as e:
                await update.message.reply_text(f"Error reading report: {e}")
        else:
            await update.message.reply_text("No reports found in the trading_diary folder.")

    async def handle_analyze(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("Initiating manual OODA cycle. Please wait...")
        result_msg = await self.trigger_analyze_callback()
        await update.message.reply_text(f"Manual Analysis Complete:\n{result_msg}")
