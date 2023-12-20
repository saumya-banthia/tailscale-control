import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  ToggleField,
  SuspensefulImage,
  TextField,
} from "decky-frontend-lib";
import React, { VFC,
         useState,
         useEffect
        } from "react";
import { GiMeshNetwork } from "react-icons/gi";
import qr from "../assets/qr.svg"

const LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE = 'tailscaleToggle';
const LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE = 'tailscaleExitNode';
const LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP = 'tailscaleNodeIP';
const LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN = 'tailscaleAllowLAN';

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {

  const [ tailscaleToggleState, setTailscaleToggleState ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, false));
  const [ tailscaleExitNode, setTailscaleExitNode ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE, false));
  const [ tailscaleNodeIP, setTailscaleNodeIP ] = useState<string>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, ''));
  const [ tailscaleAllowLAN, setTailscaleAllowLAN ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN, false));
  const [ deviceStatus, setDeviceStatus ] = useState<JSX.Element>(
  // TODO: when you have time, see if this can be replaced with ReorderableList
  // https://wiki.deckbrew.xyz/en/api-docs/decky-frontend-lib/custom/components/ReorderableList
  <div>
    <span>Device Status</span>
      <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
        </table>
  </div>
  );

  function getInitialState(key: string, defaultState:any = 0, paramString:string = 'value') {
    const settingsString = localStorage.getItem(key);
    if (!settingsString) {
      return defaultState;
    }
    const storedSettings = JSON.parse(settingsString);
    return storedSettings[paramString] || defaultState;
  }

  function transposeObject<T>(obj: { [key: string]: T[] }): T[][] {
    const values = Object.values(obj);
    const transposed: T[][] = [];
    for (let i = 0; i < values[0].length; i++) {
      const row: T[] = [];
      for (let j = 0; j < values.length; j++) {
        row.push(values[j][i]);
      }
      transposed.push(row);
    }
    return transposed;
  }

  const ipCheck = (): boolean => {
    const ipRegex = new RegExp(/^([0-9]{1,3}\.){3}[0-9]{1,3}$/);
    // checking if IP address list is empty, if not, compare IP address to list
    var res = ipRegex.test(tailscaleNodeIP)
    console.log("IP address is valid: " + res);
    return res;
    // if (ipRegex.test(tailscaleNodeIP) /*&& tailscaleDeviceIPList.length > 0 && tailscaleDeviceIPList.includes(tailscaleNodeIP)*/) {
    //   console.log("IP address is valid");
    //   return true;
    // } else {
    //   console.log("IP address is not valid, unsetting IP");
    //   return false;
    // }
  }

  const callPluginMethod = async (toggle?: string) => {
    if (toggle === 'down') {
      const data = await serverAPI.callPluginMethod('down', {});
      if (data.success) {
        console.log("Toggle down state: " + data.result);
      }
    } 
    if (toggle === 'up') {
      var exit_node = tailscaleExitNode;
      var node_ip = tailscaleNodeIP;
      var allow_lan_access = tailscaleAllowLAN;
      const data = await serverAPI.callPluginMethod<{exit_node: boolean, node_ip: string, allow_lan_access: boolean}, boolean>('up', {exit_node, node_ip, allow_lan_access});
      if (data.success) {
        console.log("Toggle up state: " + data.result);
      }
    }
  };

  const togglerAndSetter = async(setter: any, key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify({ value }));
    setter(value);
  }

  const tailscaleUp = async(log: string) => {
    console.log(log);
    if (tailscaleToggleState) {
      callPluginMethod('up');
    }
  }

  const toggleExitNode = async(switchValue: boolean) => {
    togglerAndSetter(setTailscaleExitNode, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE, switchValue);
    tailscaleUp("Exit Node toggled: "+ switchValue);
  }

  const toggleTailscale = async(switchValue: boolean) => {
    togglerAndSetter(setTailscaleToggleState, LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, switchValue);
    console.log("Tailscale toggled: "+ switchValue);
    callPluginMethod(switchValue ? 'up' : 'down');
  }

  const toggleLANAccess = async(switchValue: boolean) => {
    togglerAndSetter(setTailscaleAllowLAN, LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN, switchValue);
    tailscaleUp("LAN Access toggled: "+ switchValue);
  }

  const setNodeIP = async(ip: React.ChangeEvent<HTMLInputElement>) => {
    togglerAndSetter(setTailscaleNodeIP, LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, ip.target.value);
  }

  const getTailscaleState = async () => {
    const data = await serverAPI.callPluginMethod("get_tailscale_state", {});
    if (data.success) {
      var res = Boolean(data.result)
      localStorage.setItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, JSON.stringify({ res }));
      setTailscaleToggleState(res);
    }
  }

  const getDeviceStatus = async () => {
    const data = await serverAPI.callPluginMethod("get_tailscale_device_status", {});
    if (data.success) {
      const deviceKeys = Object.keys(data.result);
      const transposedDeviceStatus = transposeObject(data.result);
      setDeviceStatus(
        // TODO: when you have time, see if this can be replaced with ReorderableList
        // https://wiki.deckbrew.xyz/en/api-docs/decky-frontend-lib/custom/components/ReorderableList
        <div>
          <span>Device Status</span>
          <table>
            <thead>
              <tr>
                {deviceKeys.map((key) => (
                  <th>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transposedDeviceStatus.map((row) => (
                <tr>
                  {row.map((value) => (
                    <td>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  // use setInterval to call getDeviceStatus every 5 seconds which clears the interval when the component unmounts
  useEffect(() => {
    console.log('mounted');
    var exit_node = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE);
    var node_ip = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP);
    var allow_lan_access = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN);
    if (exit_node) {
      setTailscaleExitNode(JSON.parse(exit_node).value);
    }
    if (node_ip) {
      setTailscaleNodeIP(JSON.parse(node_ip).value);
      if (!ipCheck()) {
        togglerAndSetter(setTailscaleNodeIP, LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, '');
        console.log("IP address is not valid, unsetting IP");
      }
    }
    if (allow_lan_access) {
      setTailscaleAllowLAN(JSON.parse(allow_lan_access).value);
    }
    const interval = setInterval(() => {
      getTailscaleState();
      getDeviceStatus();
    }, 1000);
    return () => {clearInterval(interval); console.log('unmounted');}
  }, [serverAPI]);
  
  return (
    <PanelSection title="Settings">
        <PanelSectionRow>
          <ToggleField
          bottomSeparator='standard'
          checked={tailscaleToggleState}
          label='Toggle Tailscale'
          description='Toggles Tailscale On or Off'
          onChange={toggleTailscale} />
          <TextField
          bShowClearAction={true}
          label='Exit Node IP'
          description='Enter Exit Node IP'
          onChange={setNodeIP}
          value={tailscaleNodeIP}
          />
          <ToggleField
          bottomSeparator='standard'
          checked={tailscaleExitNode}
          label='Toggle Exit Node'
          description='Enter a valid Exit Node IP before toggling Exit Node On or Off'
          onChange={toggleExitNode} />
          <ToggleField
          bottomSeparator='standard'
          checked={tailscaleAllowLAN}
          label='Toggle LAN Access'
          description='Toggles LAN Access On or Off'
          disabled={tailscaleExitNode ? false : true}
          onChange={toggleLANAccess} />
        </PanelSectionRow>
        <PanelSectionRow>
        {/* Show Device Status */}
          {deviceStatus}
        </PanelSectionRow>
        <PanelSectionRow>
          <div>Tailscale Setup</div>
          <SuspensefulImage
          title="Tailscale Setup"
          src={qr}
          style={{ maxWidth: '85%' }}
          />
        </PanelSectionRow>
    </PanelSection>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className={staticClasses.Title}>Tailscale Control</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <GiMeshNetwork />,
  };
});
