import logging
import subprocess

logging.basicConfig(filename="/tmp/template.log",
                    format='[Template] %(asctime)s %(levelname)s %(message)s',
                    filemode='w+',
                    force=True)
logger=logging.getLogger()
# logger.setLevel(logging.INFO) # can be changed to logging.DEBUG for debugging issues
logger.setLevel(logging.DEBUG) # can be changed to logging.DEBUG for debugging issues


class Plugin:
    async def up(self):
        subprocess.run(["tailscale", "up"], timeout=10)
        return True

    async def down(self):
        subprocess.run(["tailscale", "down"], timeout=10)
        return True

    async def get_tailscale_state(self):
        result = not subprocess.call(["tailscale", "status"], timeout=10)
        return result
