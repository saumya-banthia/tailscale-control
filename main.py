import subprocess
import decky_plugin
import os
import re
import logging

os.environ["XDG_RUNTIME_DIR"] = "/run/user/1000"
# Setup environment variables
deckyHomeDir = decky_plugin.DECKY_HOME
settingsDir = decky_plugin.DECKY_PLUGIN_SETTINGS_DIR
loggingDir = decky_plugin.DECKY_PLUGIN_LOG_DIR
logger = decky_plugin.logger

# Add install directories used by https://github.com/tailscale-dev/deck-tailscale
# and Nix (https://github.com/saumya-banthia/tailscale-control/issues/7) to the PATH
user_dirs = ["/opt/tailscale", "/home/deck/.nix-profile/bin"]
current_path = os.environ["PATH"].split(":")
new_path = ":".join(
    current_path + [user_dir for user_dir in user_dirs if user_dir not in current_path]
)
os.environ["PATH"] = new_path
# Setup backend logger
logger.setLevel(logging.DEBUG)  # can be changed to logging.DEBUG for debugging issues
logger.info("[backend] Settings path: {}".format(settingsDir))


class Plugin:
    async def up(
        self,
        exit_node=False,
        node_ip="",
        allow_lan_access=True,
        custom_flags="",
        login_server="",
    ):
        """
        Bring up the Tailscale connection.

        Args:
            exit_node (bool): Whether to use an exit node.
            node_ip (str): The IP address of the exit node.
            allow_lan_access (bool): Whether to allow LAN access.
            login_server (str): Tailscale login server url
            custom_flags (str): User defined flags
        Returns:
            bool: True if the Tailscale connection is successfully brought up, False otherwise.
        """
        try:
            exit_node = bool(exit_node)
            allow_lan_access = bool(allow_lan_access)
            cmd_list = ["tailscale", "up"]
            cmd_list.append(f"--exit-node={node_ip}") if (exit_node) or (not exit_node and node_ip is "") else None
            cmd_list.append("--exit-node-allow-lan-access=true") if node_ip != "" and allow_lan_access else None
            [cmd_list.append(elem) for elem in custom_flags.split()] if custom_flags != "" else None
            cmd_list.append(f"--login-server={login_server}") if login_server else None
            cmd_list.append("--reset")

            logger.debug(f"Tailscale up with command: {' '.join(cmd_list)}")

            return not subprocess.run(cmd_list, timeout=10, check=False)
        except Exception as e:
            logger.error(e, "error")

    async def down(self):
        """
        Bring down the Tailscale connection.

        Returns:
            bool: True if the Tailscale connection is successfully brought down, False otherwise.
        """
        try:
            subprocess.run(["tailscale", "down"], timeout=10, check=False)
            return True
        except Exception as e:
            logger.error(e, "error")

    async def get_tailscale_state(self):
        """
        Get the state of the Tailscale connection.

        Returns:
            bool: True if the Tailscale connection is active, False otherwise.
        """
        try:
            result = not subprocess.call(
                ["tailscale", "status"], timeout=10, stdout=subprocess.DEVNULL
            )
            return result
        except Exception as e:
            logger.error(e, "error")

    async def get_tailscale_exit_node_ip_list(self):
        """
        Get the exit node of the Tailscale connection.

        Returns:
            str: The IP address of the exit node.
        """
        try:
            output = subprocess.check_output(
                ["tailscale", "status"], timeout=10, text=True
            )
            lines = [elem for elem in output.splitlines() if len(elem) != 0]
            ip_pattern = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
            # over-engineered regex to avoid matching "exit node" in the middle of a line
            node_pattern = ip_pattern + r".*(-|offline|online|active|idle).*exit node"
            return [
                re.findall(ip_pattern, ip)[0]
                for ip in lines
                if re.search(node_pattern, ip)
            ]
        except Exception as e:
            logger.error(e, "error")

    async def get_tailscale_device_status(self):
        """
        Get the status of Tailscale devices.

        Returns:
            dict: A dictionary containing the name and status of Tailscale devices.
        """
        try:
            output = subprocess.check_output(
                ["tailscale", "status"], timeout=10, text=True
            )
            lines = [elem for elem in output.splitlines() if len(elem) != 0]
            output_dict = {
                # "ip": [],
                "name": [],
                # "type": [],
                "status": [],
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
            logger.debug(output)
            logger.debug(output_dict)
            return output_dict
        except Exception as e:
            logger.error(e, "error")
