import sys
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch

# Mock python-telegram-bot before any imports
mock_telegram = MagicMock()
mock_telegram_ext = MagicMock()

sys.modules["telegram"] = mock_telegram
sys.modules["telegram.ext"] = mock_telegram_ext

import pytest
from telegram_manager import TelegramManager


@pytest.fixture
def mock_callbacks():
    return {
        "get_status": AsyncMock(return_value="Status OK"),
        "get_report": AsyncMock(return_value="/path/to/report.pdf"),
        "trigger_analyze": AsyncMock(return_value="Analysis Done"),
    }


@patch("telegram_manager.ApplicationBuilder")
@patch("telegram_manager.CommandHandler")
@patch("os.getenv")
def test_telegram_manager_init_enabled(
    mock_getenv, mock_command_handler, mock_app_builder, mock_callbacks
):
    # Setup
    mock_getenv.side_effect = lambda k, d=None: {
        "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
        "TELEGRAM_BOT_TOKEN": "test_token",
        "TELEGRAM_CHAT_ID": "test_chat_id",
    }.get(k, d)

    mock_app = MagicMock()
    mock_app_builder.return_value.token.return_value.build.return_value = mock_app

    # Execute
    tm = TelegramManager(
        mock_callbacks["get_status"],
        mock_callbacks["get_report"],
        mock_callbacks["trigger_analyze"],
    )

    # Assert
    assert tm.enabled is True
    assert tm.bot_token == "test_token"
    assert tm.chat_id == "test_chat_id"
    assert tm.app == mock_app
    mock_app_builder.return_value.token.assert_called_once_with("test_token")
    assert mock_app.add_handler.call_count == 3


@patch("telegram_manager.ApplicationBuilder")
@patch("os.getenv")
def test_telegram_manager_init_error(mock_getenv, mock_app_builder, mock_callbacks):
    # Setup
    mock_getenv.side_effect = lambda k, d=None: {
        "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
        "TELEGRAM_BOT_TOKEN": "test_token",
        "TELEGRAM_CHAT_ID": "test_chat_id",
    }.get(k, d)

    mock_app_builder.return_value.token.return_value.build.side_effect = Exception(
        "Build Error"
    )

    # Execute
    tm = TelegramManager(
        mock_callbacks["get_status"],
        mock_callbacks["get_report"],
        mock_callbacks["trigger_analyze"],
    )

    # Assert
    assert tm.app is None


@patch("os.getenv")
def test_telegram_manager_init_disabled(mock_getenv, mock_callbacks):
    # Setup
    mock_getenv.side_effect = lambda k, d=None: {
        "TELEGRAM_NOTIFICATIONS_ENABLED": "false"
    }.get(k, d)

    # Execute
    tm = TelegramManager(
        mock_callbacks["get_status"],
        mock_callbacks["get_report"],
        mock_callbacks["trigger_analyze"],
    )

    # Assert
    assert tm.enabled is False
    assert tm.app is None


@patch("os.getenv")
def test_telegram_manager_init_missing_credentials(mock_getenv, mock_callbacks):
    # Setup
    mock_getenv.side_effect = lambda k, d=None: {
        "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
        "TELEGRAM_BOT_TOKEN": "test_token",
        # TELEGRAM_CHAT_ID is missing
    }.get(k, d)

    # Execute
    tm = TelegramManager(
        mock_callbacks["get_status"],
        mock_callbacks["get_report"],
        mock_callbacks["trigger_analyze"],
    )

    # Assert
    assert tm.enabled is True
    assert tm.app is None


def test_start(mock_callbacks):
    with patch("telegram_manager.ApplicationBuilder") as mock_app_builder:
        # Setup
        mock_app = MagicMock()
        mock_app.initialize = AsyncMock()
        mock_app.start = AsyncMock()
        mock_app.updater.start_polling = AsyncMock()
        mock_app_builder.return_value.token.return_value.build.return_value = mock_app

        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            # Execute
            asyncio.run(tm.start())

            # Assert
            mock_app.initialize.assert_called_once()
            mock_app.start.assert_called_once()
            mock_app.updater.start_polling.assert_called_once()


def test_start_error(mock_callbacks):
    with patch("telegram_manager.ApplicationBuilder") as mock_app_builder:
        # Setup
        mock_app = MagicMock()
        mock_app.initialize = AsyncMock(side_effect=Exception("Init Error"))
        mock_app_builder.return_value.token.return_value.build.return_value = mock_app

        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            # Execute (should not raise exception)
            asyncio.run(tm.start())

            # Assert
            mock_app.initialize.assert_called_once()


def test_send_telegram_alert_success(mock_callbacks):
    with patch("telegram_manager.ApplicationBuilder") as mock_app_builder:
        # Setup
        mock_app = MagicMock()
        mock_app.bot.send_message = AsyncMock()
        mock_app_builder.return_value.token.return_value.build.return_value = mock_app

        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            # Execute
            asyncio.run(tm.send_telegram_alert("Test Alert"))

            # Assert
            mock_app.bot.send_message.assert_called_once_with(
                chat_id="test_chat_id", text="Test Alert"
            )


def test_send_telegram_alert_no_app(mock_callbacks):
    with patch(
        "os.getenv",
        side_effect=lambda k, d=None: {"TELEGRAM_NOTIFICATIONS_ENABLED": "false"}.get(
            k, d
        ),
    ):
        tm = TelegramManager(
            mock_callbacks["get_status"],
            mock_callbacks["get_report"],
            mock_callbacks["trigger_analyze"],
        )
        # Execute
        asyncio.run(tm.send_telegram_alert("Test Alert"))
        # Assert: no exception and no app to call


def test_send_telegram_alert_error(mock_callbacks):
    with patch("telegram_manager.ApplicationBuilder") as mock_app_builder:
        # Setup
        mock_app = MagicMock()
        mock_app.bot.send_message = AsyncMock(side_effect=Exception("API Error"))
        mock_app_builder.return_value.token.return_value.build.return_value = mock_app

        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            # Execute (should not raise exception)
            asyncio.run(tm.send_telegram_alert("Test Alert"))

            # Assert
            mock_app.bot.send_message.assert_called_once()


def test_handle_status(mock_callbacks):
    with patch("telegram_manager.ApplicationBuilder"):
        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            mock_update = MagicMock()
            mock_update.message.reply_text = AsyncMock()

            # Execute
            asyncio.run(tm.handle_status(mock_update, None))

            # Assert
            mock_callbacks["get_status"].assert_called_once()
            mock_update.message.reply_text.assert_called_once_with("Status OK")


def test_handle_report_success(mock_callbacks, tmp_path):
    report_file = tmp_path / "report.pdf"
    report_file.write_text("test content")
    mock_callbacks["get_report"].return_value = str(report_file)

    with patch("telegram_manager.ApplicationBuilder"):
        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            mock_update = MagicMock()
            mock_update.message.reply_document = AsyncMock()

            # Execute
            asyncio.run(tm.handle_report(mock_update, None))

            # Assert
            mock_callbacks["get_report"].assert_called_once()
            mock_update.message.reply_document.assert_called_once()
            args, kwargs = mock_update.message.reply_document.call_args
            assert kwargs["filename"] == "report.pdf"


def test_handle_report_not_found(mock_callbacks):
    mock_callbacks["get_report"].return_value = "/non/existent/path"

    with patch("telegram_manager.ApplicationBuilder"):
        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            mock_update = MagicMock()
            mock_update.message.reply_text = AsyncMock()

            # Execute
            asyncio.run(tm.handle_report(mock_update, None))

            # Assert
            mock_update.message.reply_text.assert_called_once_with(
                "No reports found in the trading_diary folder."
            )


def test_handle_report_error(mock_callbacks, tmp_path):
    report_file = tmp_path / "report.pdf"
    report_file.write_text("test content")
    mock_callbacks["get_report"].return_value = str(report_file)

    with patch("telegram_manager.ApplicationBuilder"):
        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            mock_update = MagicMock()
            mock_update.message.reply_text = AsyncMock()

            # Simulate error by patching 'open'
            with patch("builtins.open", side_effect=Exception("Read Error")):
                # Execute
                asyncio.run(tm.handle_report(mock_update, None))

            # Assert
            mock_update.message.reply_text.assert_called_once()
            assert (
                "Error reading report: Read Error"
                in mock_update.message.reply_text.call_args[0][0]
            )


def test_handle_analyze(mock_callbacks):
    with patch("telegram_manager.ApplicationBuilder"):
        with patch(
            "os.getenv",
            side_effect=lambda k, d=None: {
                "TELEGRAM_NOTIFICATIONS_ENABLED": "true",
                "TELEGRAM_BOT_TOKEN": "test_token",
                "TELEGRAM_CHAT_ID": "test_chat_id",
            }.get(k, d),
        ):
            tm = TelegramManager(
                mock_callbacks["get_status"],
                mock_callbacks["get_report"],
                mock_callbacks["trigger_analyze"],
            )

            mock_update = MagicMock()
            mock_update.message.reply_text = AsyncMock()

            # Execute
            asyncio.run(tm.handle_analyze(mock_update, None))

            # Assert
            assert mock_update.message.reply_text.call_count == 2
            mock_callbacks["trigger_analyze"].assert_called_once()
            mock_update.message.reply_text.assert_called_with(
                "Manual Analysis Complete:\n{result_msg}".format(
                    result_msg="Analysis Done"
                )
            )
