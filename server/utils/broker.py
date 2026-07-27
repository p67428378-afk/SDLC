import asyncio
import os
import json
from typing import Set, Dict, AsyncGenerator


class EventBroker:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL")
        self.redis = None
        self.use_redis = False
        self.listeners: Dict[str, Set[asyncio.Queue]] = {}

    async def connect(self):
        if self.redis_url:
            try:
                import redis.asyncio as aioredis

                self.redis = aioredis.from_url(self.redis_url, decode_responses=True)
                await self.redis.ping()
                self.use_redis = True
                print("Connected to Redis for Event Broker")
            except Exception as e:
                print(
                    f"Failed to connect to Redis: {e}. Falling back to in-memory broker."
                )
                self.use_redis = False

    async def publish(self, channel: str, message: dict):
        message_str = json.dumps(message)
        if self.use_redis and self.redis:
            try:
                await self.redis.publish(channel, message_str)
                return
            except Exception as e:
                print(f"Redis publish failed: {e}. Falling back to in-memory.")

        if channel in self.listeners:
            for queue in list(self.listeners[channel]):
                await queue.put(message_str)

    async def subscribe(self, channels: list[str]) -> AsyncGenerator[str, None]:
        if self.use_redis and self.redis:
            try:
                pubsub = self.redis.pubsub()
                await pubsub.subscribe(*channels)
                try:
                    while True:
                        message = await pubsub.get_message(
                            ignore_subscribe_messages=True, timeout=1.0
                        )
                        if message:
                            yield message["data"]
                        await asyncio.sleep(0.1)
                finally:
                    await pubsub.unsubscribe(*channels)
                    await pubsub.close()
                return
            except Exception as e:
                print(f"Redis subscribe failed: {e}. Falling back to in-memory.")

        # In-memory multi-channel subscription
        queue = asyncio.Queue()
        for channel in channels:
            if channel not in self.listeners:
                self.listeners[channel] = set()
            self.listeners[channel].add(queue)

        try:
            while True:
                msg = await queue.get()
                yield msg
        finally:
            for channel in channels:
                if channel in self.listeners:
                    self.listeners[channel].discard(queue)
                    if not self.listeners[channel]:
                        del self.listeners[channel]


# Global broker instance
broker = EventBroker()


def publish_event_sync(channel: str, message: dict):
    try:
        loop = asyncio.get_running_loop()
        if loop.is_running():
            loop.create_task(broker.publish(channel, message))
        else:
            asyncio.run(broker.publish(channel, message))
    except RuntimeError:
        # No running event loop
        asyncio.run(broker.publish(channel, message))
