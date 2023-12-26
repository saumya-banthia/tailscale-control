import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  ToggleField,
  SuspensefulImage,
  DropdownItem,
  SingleDropdownOption,
  DropdownOption,
} from "decky-frontend-lib";
import { VFC,
         useState,
         useEffect
        } from "react";
import { GiMeshNetwork } from "react-icons/gi";
import qr from "../assets/qr.svg"

const LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE = 'tailscaleToggle';
const LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE = 'tailscaleExitNode';
const LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP = 'tailscaleNodeIP';
const LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN = 'tailscaleAllowLAN';
const LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST = 'tailscaleExitNodeList';
const LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED = 'tailscaleExitNodeListDisabled';

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {

  const [ tailscaleToggleState, setTailscaleToggleState ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, false));
  const [ tailscaleExitNode, setTailscaleExitNode ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE, false));
  const [ tailscaleExitNodeIPList, setTailscaleExitNodeIPList ] = useState<DropdownOption[]>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST, [{ data: 0, label: "Unset" }]));
  const [ tailscaleExitNodeIPListDisabled, setTailscaleNodeIPListDisabled ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, true));
  const [ tailscaleNodeIP, setTailscaleNodeIP ] = useState<string>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, ''));
  const [ tailscaleAllowLAN, setTailscaleAllowLAN ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN, true));
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

  const togglerAndSetter = async(setter: any, key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify({ value }));
    setter(value);
  }

  const getExitNodeIPList = async () => {
    const data = await serverAPI.callPluginMethod("get_tailscale_exit_node_ip_list", {});
    if (data.success) {
      var exitNodeIPList = Array(data.result);
      var exitNodeIPListOptions = tailscaleExitNodeIPList;
      // use map to populate the dropdown list
      exitNodeIPList.map((ip, _) => {
        if (tailscaleExitNodeIPList.find((o) => String(o.label) == String(ip)) || ip === null) {
          console.log("IP already exists in list: " + ip);
        } else {
          // append to the end of the list
          exitNodeIPListOptions.push({ data: exitNodeIPListOptions.length, label: String(ip) });
        }
      });
      togglerAndSetter(setTailscaleExitNodeIPList, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST, exitNodeIPListOptions);
      togglerAndSetter(setTailscaleNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, false)
      var toggleState = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE);
      if (toggleState) {
        JSON.parse(toggleState).value ? togglerAndSetter(setTailscaleNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, false) : togglerAndSetter(setTailscaleNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, true);
      }
    }
  }

  const callPluginMethod = async (toggle?: string) => {
    if (toggle === 'down') {
      const data = await serverAPI.callPluginMethod('down', {});
      if (data.success) {
        var value: DropdownOption[] = [{ data: 0, label: "Unset" }];
        togglerAndSetter(setTailscaleExitNodeIPList, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST, value);
        togglerAndSetter(setTailscaleNodeIP, LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, '');
        togglerAndSetter(setTailscaleNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, true);
      }
    } 
    if (toggle === 'up') {
      var exit_node_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE);
      var node_ip_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP);
      var allow_lan_access_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN);
      var exit_node = exit_node_getter? JSON.parse(exit_node_getter).value : false;
      var node_ip = node_ip_getter? JSON.parse(node_ip_getter).value : '';
      var allow_lan_access = allow_lan_access_getter? JSON.parse(allow_lan_access_getter).value : true;
      const data = await serverAPI.callPluginMethod<{exit_node: boolean, node_ip: string, allow_lan_access: boolean}, boolean>('up', {exit_node, node_ip, allow_lan_access});
      if (data.success) {
        console.log("Toggle up state: " + data.result);
        getExitNodeIPList();
      }
    }
  };

  const tailscaleUp = async(log: string) => {
    console.log(log);
    var tailscaleState = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE);
    if (tailscaleState) {
      JSON.parse(tailscaleState).value ? callPluginMethod('up') : null;
    }
  }

  const toggleExitNode = async(switchValue: boolean) => {
    togglerAndSetter(setTailscaleExitNode, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE, switchValue);
    // if toggling exit node off, unset the exit node IP
    switchValue ? console.log(tailscaleNodeIP) : togglerAndSetter(setTailscaleNodeIP, LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, '');
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

  const setNodeIP = async(ip: SingleDropdownOption) => {
    togglerAndSetter(setTailscaleNodeIP, LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, ip.label==="Unset"? '' : ip.label);
    tailscaleUp("Exit Node IP set to: "+ ip.label);
  }

  const getTailscaleState = async () => {
    const data = await serverAPI.callPluginMethod("get_tailscale_state", {});
    if (data.success) {
      var value = Boolean(data.result)
      togglerAndSetter(setTailscaleToggleState, LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, value);
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

  // set up the initial state
  useEffect(() => {
    console.log('mounted');
    var exit_node_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE);
    var node_ip_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP);
    var allow_lan_access_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN);
    var exit_node_list_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST);
    var exit_node_list_disabled_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED);
    exit_node_getter? JSON.parse(exit_node_getter).value : false;
    node_ip_getter? JSON.parse(node_ip_getter).value : false;
    allow_lan_access_getter? JSON.parse(allow_lan_access_getter).value : true;
    exit_node_list_getter? JSON.parse(exit_node_list_getter).value : [{ data: 0, label: "Unset" }];
    exit_node_list_disabled_getter? JSON.parse(exit_node_list_disabled_getter).value : true;
    const interval = setInterval(() => {
      getTailscaleState();
      getDeviceStatus();
      var tailscaleState = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE);
      if (tailscaleState) {
        JSON.parse(tailscaleState).value ? setTailscaleNodeIPListDisabled(false) : setTailscaleNodeIPListDisabled(true);
      }
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
          <DropdownItem
          bottomSeparator='none'
          onMenuOpened={() => getExitNodeIPList()}
          disabled={tailscaleExitNodeIPListDisabled}
          menuLabel='Exit Node IP'
          description='Select an Exit Node IP, Note: this is currently NOT synced to changes made outside of the plugin, unlike tailscale toggle.'
          onChange={setNodeIP}
          selectedOption={tailscaleExitNodeIPList.find((o) => o.label === tailscaleNodeIP)?.data || 0}
          rgOptions={tailscaleExitNodeIPList.map((o) => ({
            data: o.data,
            label: o.label
          }))}
          />
          <ToggleField
          bottomSeparator='standard'
          checked={tailscaleExitNode}
          label='Toggle Exit Node'
          description='Enter a valid Exit Node IP before toggling Exit Node On or Off'
          disabled={tailscaleExitNodeIPListDisabled}
          onChange={toggleExitNode} />
          <ToggleField
          bottomSeparator='standard'
          checked={tailscaleAllowLAN}
          label='Toggle LAN Access'
          description='WARNING: Disabling LAN access, may cause your SSH to become inaccessible (this can be reversed through Desktop Mode)'
          disabled={tailscaleExitNode && !tailscaleExitNodeIPListDisabled ? false : true}
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
