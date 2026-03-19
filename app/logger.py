from loguru import logger
import sys
from pathlib import Path

def setup_logger(log_file: str = "logs/app.log", log_level: str = "INFO"):
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)

    logger.remove()
    logger.add(
        sys.stdout,
        colorize=True,
        level=log_level.upper(),
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
               "<level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    )

    logger.add(
        log_file,
        rotation="5 MB",
        retention="10 days",
        level=log_level.upper(),
        enqueue=True,
        encoding="utf-8",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    )

    logger.info(f"Logger initialized (level={log_level}, file={log_file})")
    return logger
