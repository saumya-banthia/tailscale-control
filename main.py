import subprocess
import decky_plugin
import os

os.environ['XDG_RUNTIME_DIR'] = '/run/user/1000'


class Plugin:
    async def up(self, exit_node=False, node_ip='', allow_lan_access=False):
        """
        Bring up the Tailscale connection.

        Args:
            exit_node (bool): Whether to use an exit node.
            node_ip (str): The IP address of the exit node.
            allow_lan_access (bool): Whether to allow LAN access.

        Returns:
            bool: True if the Tailscale connection is successfully brought up, False otherwise.
        """
        try:
            cmd_list = ["tailscale", "up"]
            if exit_node and node_ip is not '':
                cmd_list.append(f"--exit-node={node_ip}")
                if allow_lan_access:
                    cmd_list.append("--exit-node-allow-lan-access=true")
            subprocess.run(cmd_list, timeout=10, check=False)
            return True
        except Exception as e:
            decky_plugin.logger.error(e, "error")

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
            decky_plugin.logger.error(e, "error")

    async def get_tailscale_state(self):
        """
        Get the state of the Tailscale connection.

        Returns:
            bool: True if the Tailscale connection is active, False otherwise.
        """
        try:
            result = not subprocess.call(["tailscale", "status"], timeout=10)
            return result
        except Exception as e:
            decky_plugin.logger.error(e, "error")

    async def get_tailscale_device_status(self):
        """
        Get the status of Tailscale devices.

        Returns:
            dict: A dictionary containing the name and status of Tailscale devices.
        """
        try:
            output = subprocess.check_output(["tailscale", "status"], timeout=10, text=True)
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
            decky_plugin.logger.debug(output)
            decky_plugin.logger.debug(output_dict)
            return output_dict
        except Exception as e:
            decky_plugin.logger.error(e, "error")
