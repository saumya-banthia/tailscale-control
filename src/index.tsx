import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  ToggleField,
  SuspensefulImage,
  DropdownItem,
  DropdownOption,
  Field,
  TextField,
  ConfirmModal,
  ButtonItem,
  showModal,
} from "decky-frontend-lib";
import { VFC,
         useState,
         useEffect
        } from "react";
import { GiMeshNetwork } from "react-icons/gi";
import qr from "../assets/qr.svg"

const LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE = 'tailscaleToggle';
const LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP = 'tailscaleNodeIP';
const LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN = 'tailscaleAllowLAN';
const LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST = 'tailscaleExitNodeList';
const LOCAL_STORAGE_KEY_TAILSCALE_LOGIN_SERVER = 'tailscaleLoginServer';
const LOCAL_STORAGE_KEY_TAILSCALE_UP_CUSTOM_FLAGS = 'tailscaleUpCustomFlags';
const LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED = 'tailscaleExitNodeListDisabled';
const TAILSCALE_LOGIN_SERVER = "";
const DEFAULT_TAILSCALE_UP_CUSTOM_FLAGS = "--operator=deck";

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {

  const [ tailscaleToggleState, setTailscaleToggleState ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, false));
  const [ tailscaleExitNodeIPList, setTailscaleExitNodeIPList ] = useState<DropdownOption[]>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST, [{ data: 0, label: "Unset" }]));
  const [ tailscaleExitNodeIPListDisabled, setTailscaleExitNodeIPListDisabled ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, true));
  const [ tailscaleNodeIP, setTailscaleNodeIP ] = useState<string>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, ''));
  const [ tailscaleLoginServer, setTailscaleLoginServer ] = useState<string>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_LOGIN_SERVER, TAILSCALE_LOGIN_SERVER));
  const [ tailscaleUpCustomFlags, setTailscaleUpCustomFlags ] = useState<string>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_UP_CUSTOM_FLAGS, DEFAULT_TAILSCALE_UP_CUSTOM_FLAGS));
  const [ tailscaleAllowLAN, setTailscaleAllowLAN ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN, true));
  // TODO: when you have time, see if this can be replaced with ReorderableList
  // https://wiki.deckbrew.xyz/en/api-docs/decky-frontend-lib/custom/components/ReorderableList
  const [ deviceStatus, setDeviceStatus ] = useState<JSX.Element>(<div>Offline</div>);

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
      var exitNodeIPList = data.result as string[];
      var exitNodeIPListOptions: DropdownOption[] = [{ data: 0, label: "Unset" }];
      // use map to populate the dropdown list
      exitNodeIPList.map((ip, _) => {
        if (exitNodeIPListOptions.find((o) => String(o.label) == String(ip)) || ip === null || String(ip) === '') {
          console.log("IP already exists in list: " + ip);
        } else {
          // append to the end of the list
          exitNodeIPListOptions.push({ data: exitNodeIPListOptions.length, label: String(ip) });
        }
      });
      console.log("Exit Node IP List: ");
      console.log(exitNodeIPListOptions);
      togglerAndSetter(setTailscaleExitNodeIPList, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST, exitNodeIPListOptions);
      togglerAndSetter(setTailscaleExitNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, false)
      var toggleState = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE);
      if (toggleState) {
        JSON.parse(toggleState).value ? togglerAndSetter(setTailscaleExitNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, false) : togglerAndSetter(setTailscaleExitNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, true);
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
        togglerAndSetter(setTailscaleExitNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, true);
      }
    } 
    if (toggle === 'up') {
      var node_ip_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP);
      var allow_lan_access_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN);
      var login_server_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_LOGIN_SERVER);
      var custom_flags_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_UP_CUSTOM_FLAGS);
      var node_ip = node_ip_getter? JSON.parse(node_ip_getter).value : '';
      var login_server = login_server_getter? JSON.parse(login_server_getter).value : '';
      var custom_flags = custom_flags_getter? JSON.parse(custom_flags_getter).value : DEFAULT_TAILSCALE_UP_CUSTOM_FLAGS;
      var allow_lan_access = allow_lan_access_getter? JSON.parse(allow_lan_access_getter).value : true;
      const data = await serverAPI.callPluginMethod<{
        node_ip: string, 
        allow_lan_access: boolean,
        custom_flags: string,
        login_server: string,
      }, boolean>('up', {
        node_ip: node_ip, 
        allow_lan_access: allow_lan_access, 
        custom_flags: custom_flags,
        login_server: login_server
      });
      // console.log("Toggle Up Data: " + data.result);
      // console.log("Toggle Up Success: " + data.success);
      if (data.success) {
        console.log("Toggle up state: " + data.result + " with login server: " + login_server + " and custom flags: " + custom_flags + " and node ip: " + node_ip + " and allow lan access: " + allow_lan_access);
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

  function isValidUrl(url: string): boolean {
    const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{2,5})?(\/\S*)?$/i;
    return urlPattern.test(url);
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

  const setNodeIP = async(ip: DropdownOption) => {
    togglerAndSetter(setTailscaleNodeIP, LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, ip.label==="Unset"? '' : ip.label);
    tailscaleUp("Exit Node IP set to: "+ ip.label);
  }

  const setLoginServer = async(url: string) => {
    togglerAndSetter(setTailscaleLoginServer, LOCAL_STORAGE_KEY_TAILSCALE_LOGIN_SERVER, isValidUrl(url) ? url : TAILSCALE_LOGIN_SERVER);
  }

  const setCustomFlags = async(flags: string) => {
    togglerAndSetter(setTailscaleUpCustomFlags, LOCAL_STORAGE_KEY_TAILSCALE_UP_CUSTOM_FLAGS, flags ? flags : DEFAULT_TAILSCALE_UP_CUSTOM_FLAGS);
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

  const popupMiscSetting = () => {
    let closePopup = () => {};
    let login_server: string, custom_flags: string = '';
    let Popup = () => {

      return <ConfirmModal closeModal={closePopup} strTitle="Advanced Settings"  
        onOK={() => {
          login_server ? setLoginServer(login_server) : null;
          custom_flags ? setCustomFlags(custom_flags) : null;
          if (tailscaleToggleState) {
            console.log("Restart Tailscale: up config change")
            callPluginMethod('down');
            tailscaleUp("Restart with flag: --login-server="+ tailscaleLoginServer + " " + tailscaleUpCustomFlags);
          }
        }}>
            <p>Clicking Confirm will restart Tailscale if it is running</p>
            <DropdownItem
              bottomSeparator='none'
              onMenuOpened={() => getExitNodeIPList()}
              disabled={tailscaleExitNodeIPListDisabled}
              menuLabel='Exit Node IP'
              label='Exit Node IP'
              description='Select an Exit Node IP, Note: this is currently NOT synced to changes made outside of the plugin, unlike tailscale toggle.'
              onChange={setNodeIP}
              selectedOption={tailscaleExitNodeIPList.find((o) => o.label === tailscaleNodeIP)?.data || 0}
              rgOptions={tailscaleExitNodeIPList.map((o) => ({
                data: o.data,
                label: o.label
              }))} />
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
            <TextField
              label="Tailscale Login Server"
              description="If you are running Headscale, use desktop mode to login for the 1st time (to generate login token). Leaving blank uses default."
              value={tailscaleLoginServer} 
              onChange={(event) => login_server = event.target.value} />
            <TextField
              label="Tailscale Up Custom Flags"
              description="Remember checking your --operator, which defaults to 'deck' for SteamOS. Leaving blank will reset to default i.e.: --operator=deck."
              value={tailscaleUpCustomFlags} 
              onChange={(event) => custom_flags = event.target.value} />
          </ConfirmModal>
    };

    const modal = showModal(<Popup />, window)
    closePopup = modal.Close;
  }

  // set up the initial state
  useEffect(() => {
    console.log('mounted');
    var node_ip_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP);
    var allow_lan_access_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN);
    var exit_node_list_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST);
    var exit_node_list_disabled_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED);
    node_ip_getter? JSON.parse(node_ip_getter).value : false;
    allow_lan_access_getter? JSON.parse(allow_lan_access_getter).value : true;
    exit_node_list_getter? JSON.parse(exit_node_list_getter).value : [{ data: 0, label: "Unset" }];
    exit_node_list_disabled_getter? JSON.parse(exit_node_list_disabled_getter).value : true;
    const interval = setInterval(() => {
      getTailscaleState();
      var tailscaleState = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE);
      var is_ts_up = tailscaleState? JSON.parse(tailscaleState).value : false;
      is_ts_up ? (setTailscaleExitNodeIPListDisabled(false), getDeviceStatus()) : (setDeviceStatus(<div>Offline</div>), setTailscaleExitNodeIPListDisabled(true));
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
          <ButtonItem
            layout="below"
            onClick={popupMiscSetting}
            bottomSeparator='standard'>
            Advanced Settings
          </ButtonItem>
          <Field 
            focusable={true}
            bottomSeparator='none'
            label="Device Status"/>
          {deviceStatus}
          <Field bottomSeparator='standard'/>
          <Field
            focusable={true}
            bottomSeparator='none'
            label={"Tailscale Setup"}>
            <SuspensefulImage
              src={qr}
              style={{ maxWidth: '85%', padding: '7.5%' }}/>
          </Field>
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
