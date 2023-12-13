import subprocess
import decky_plugin
import os

os.environ['XDG_RUNTIME_DIR'] = '/run/user/1000'


class Plugin:
    async def up(self):
        try:
            subprocess.run(["tailscale", "up"], timeout=10, check=False)
            return True
        except Exception as e:
            decky_plugin.logger.error(e)

    async def down(self):
        try:
            subprocess.run(["tailscale", "down"], timeout=10, check=False)
            return True
        except Exception as e:
            decky_plugin.logger.error(e)

    async def get_tailscale_state(self):
        try:
            result = not subprocess.call(["tailscale", "status"], timeout=10)
            return result
        except Exception as e:
            decky_plugin.logger.error(e)

    async def get_tailscale_device_status(self):
        try:
            output = subprocess.check_output(["tailscale", "status"], timeout=10, text=True)
            decky_plugin.logger.info(output)
            lines = [elem for elem in output.splitlines() if len(elem) != 0]
            output_dict = {
                # "ip": [],
                "name": [],
                # "type": [],
                "status": []
            }
            for line in lines:
                parts = line.split()
                # check if first part is an ip address
                if not parts[0].count(".") == 3:
                    continue
                # output_dict["ip"].append(parts[0])
                output_dict["name"].append(parts[1])
                # output_dict["type"].append(parts[3])
                output_dict["status"].append(parts[4].replace(";", ""))
            decky_plugin.logger.info(output_dict)
            return output_dict
        except Exception as e:
            decky_plugin.logger.error(e)

    async def log(self, message, log_type="info"):
        if log_type == "error":
            decky_plugin.logger.error(message)
            return False
        else:
            decky_plugin.logger.info(message)
            return True
