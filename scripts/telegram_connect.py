#!/usr/bin/env python3
import asyncio
import os
import sys
from getpass import getpass
from pathlib import Path

from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


async def _run() -> int:
    if load_dotenv is not None:
        load_dotenv()

    api_id_raw = _required_env("TELEGRAM_API_ID")
    api_hash = _required_env("TELEGRAM_API_HASH")
    phone = _required_env("TELEGRAM_PHONE")
    session_name = os.getenv("TELEGRAM_SESSION", "tmp/telegram-user").strip() or "tmp/telegram-user"

    try:
        api_id = int(api_id_raw)
    except ValueError as exc:
        raise RuntimeError("TELEGRAM_API_ID must be an integer") from exc

    session_path = Path(session_name)
    session_path.parent.mkdir(parents=True, exist_ok=True)

    client = TelegramClient(str(session_path), api_id, api_hash)
    await client.connect()

    try:
        if not await client.is_user_authorized():
            print("Session is not authorized. Sending login code...")
            await client.send_code_request(phone)
            code = input("Enter Telegram login code: ").strip()
            try:
                await client.sign_in(phone=phone, code=code)
            except SessionPasswordNeededError:
                password = getpass("Enter Telegram 2FA password: ")
                await client.sign_in(password=password)

        me = await client.get_me()
        username = f"@{me.username}" if me and me.username else "<no username>"
        print("Telegram connection OK")
        print(f"User: {me.id} | {username}")
        return 0
    finally:
        await client.disconnect()


def main() -> int:
    try:
        return asyncio.run(_run())
    except RuntimeError as err:
        print(f"Error: {err}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
