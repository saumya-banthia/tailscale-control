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
  Focusable
} from "decky-frontend-lib";
import { VFC,
         useState,
         useEffect
        } from "react";
import { GiMeshNetwork } from "react-icons/gi";
import qr from "../assets/qr.svg"

const LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE = 'tailscaleToggle';
const LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP = 'tailscaleNodeIP';
const LOCAL_STORAGE_KEY_TAILSCALE_MANUAL_NODE_IP = 'tailscaleManualNodeIP';
const LOCAL_STORAGE_KEY_TAILSCALE_ALLOW_LAN = 'tailscaleAllowLAN';
const LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST = 'tailscaleExitNodeList';
const LOCAL_STORAGE_KEY_TAILSCALE_LOGIN_SERVER = 'tailscaleLoginServer';
const LOCAL_STORAGE_KEY_TAILSCALE_UP_CUSTOM_FLAGS = 'tailscaleUpCustomFlags';
const LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED = 'tailscaleExitNodeListDisabled';
const TAILSCALE_LOGIN_SERVER = "";
const DEFAULT_TAILSCALE_UP_CUSTOM_FLAGS = "--operator=deck";
const MANUAL_NODE_IP = "";

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {

  const [ tailscaleToggleState, setTailscaleToggleState ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, false));
  const [ tailscaleManualNodeIP, setTailscaleManualNodeIP ] = useState<string>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_MANUAL_NODE_IP, ''));
  const [ tailscaleExitNodeIPList, setTailscaleExitNodeIPList ] = useState<DropdownOption[]>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST, [
    { data: 0, label: "Unset" },
    { data: 1, label: tailscaleManualNodeIP + " (Manual)" }
  ]));
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
      // console.log("Data Exit Node IP List: ");
      // console.log(exitNodeIPList);
      var manual_node_ip_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_MANUAL_NODE_IP);
      var manual_node_ip_var = manual_node_ip_getter? JSON.parse(manual_node_ip_getter).value : '';
      var exitNodeIPListOptions: DropdownOption[] = [
        { data: 0, label: "Unset" },
        { data: 1, label: manual_node_ip_var + " (Manual)" }
      ];
      // use map to populate the dropdown list
      exitNodeIPList.map((ip, _) => {
        if (exitNodeIPListOptions.find((o) => String(o.label) === String(ip)) || ip === null || String(ip) === '') {
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
      toggleState? JSON.parse(toggleState).value ? togglerAndSetter(setTailscaleExitNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, false) : togglerAndSetter(setTailscaleExitNodeIPListDisabled, LOCAL_STORAGE_KEY_TAILSCALE_EXIT_NODE_LIST_DISABLED, true) : null;
    }
  }

  const callPluginMethod = async (toggle?: string) => {
    if (toggle === 'down') {
      const data = await serverAPI.callPluginMethod('down', {});
      if (data.success) {
        var manual_node_ip_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_MANUAL_NODE_IP);
        var manual_node_ip_var = manual_node_ip_getter? JSON.parse(manual_node_ip_getter).value : '';
        var value: DropdownOption[] = [
          { data: 0, label: "Unset" },
          { data: 1, label: manual_node_ip_var + " (Manual)" }
        ];
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
      var node_ip_var = node_ip_getter? JSON.parse(node_ip_getter).value : '';
      var login_server_var = login_server_getter? JSON.parse(login_server_getter).value : TAILSCALE_LOGIN_SERVER;
      var custom_flags_var = custom_flags_getter? JSON.parse(custom_flags_getter).value : DEFAULT_TAILSCALE_UP_CUSTOM_FLAGS;
      var allow_lan_access_var = allow_lan_access_getter? JSON.parse(allow_lan_access_getter).value : true;
      const data = await serverAPI.callPluginMethod<{
        node_ip: string, 
        allow_lan_access: boolean,
        custom_flags: string,
        login_server: string,
      }, boolean>('up', {
        node_ip: node_ip_var, 
        allow_lan_access: allow_lan_access_var, 
        custom_flags: custom_flags_var,
        login_server: login_server_var
      });
      // console.log("Toggle Up Data: " + data.result);
      // console.log("Toggle Up Success: " + data.success);
      if (data.success) {
        console.log("Toggle up state: " + data.result + " with login server: " + login_server_var + " and custom flags: " + custom_flags_var + " and node ip: " + node_ip_var + " and allow lan access: " + allow_lan_access_var);
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
    togglerAndSetter(setTailscaleNodeIP, LOCAL_STORAGE_KEY_TAILSCALE_NODE_IP, ip.label === "Unset" ? '' : ip.label);
    tailscaleUp("Exit Node IP/Label set to: "+ ip.label);
  }

  const setLoginServer = async(url: string) => {
    // console.log("Trying to set login server to: ");
    // console.log(url)
    // console.log(isValidUrl(url))
    // console.log(url===TAILSCALE_LOGIN_SERVER)
    // console.log(typeof(url))
    togglerAndSetter(setTailscaleLoginServer, LOCAL_STORAGE_KEY_TAILSCALE_LOGIN_SERVER, (isValidUrl(url) || url===TAILSCALE_LOGIN_SERVER) ? url : TAILSCALE_LOGIN_SERVER);
    // var login_server_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_LOGIN_SERVER);
    // var login_server_var = login_server_getter? JSON.parse(login_server_getter).value : "NOT SET"
    // console.log("Login Server set to: "+ login_server_var);
  }

  const setCustomFlags = async(flags: string) => {
    // console.log("Trying to set custom flags to: ");
    // console.log(flags)
    // console.log(typeof(flags))
    // Ensure using regex --operator=\S+ that flags contains an operator that is not empty
    togglerAndSetter(setTailscaleUpCustomFlags, LOCAL_STORAGE_KEY_TAILSCALE_UP_CUSTOM_FLAGS, flags.match(/--operator=\S+/) ? flags : DEFAULT_TAILSCALE_UP_CUSTOM_FLAGS+" "+flags.trim());
    // var custom_flags_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_UP_CUSTOM_FLAGS);
    // var custom_flags_var = custom_flags_getter? JSON.parse(custom_flags_getter).value : "NOT SET"
    // console.log("Custom Flags set to: "+ custom_flags_var);
  }

  const setManualNodeIP = async(ip: string) => {
    togglerAndSetter(setTailscaleManualNodeIP, LOCAL_STORAGE_KEY_TAILSCALE_MANUAL_NODE_IP, ip.match(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/) ? ip : '');
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
      setDeviceStatus(
        // TODO: when you have time, see if this can be replaced with ReorderableList
        // https://wiki.deckbrew.xyz/en/api-docs/decky-frontend-lib/custom/components/ReorderableList
        <div>
          <table>
            <thead>
              <tr>
                {Object.keys(data.result).map((key) => (
                  <th>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transposeObject(data.result).map((row) => (
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
    let Popup = () => {
      const [login_server, set_login_server] = useState<string>(tailscaleLoginServer);
      const [custom_flags, set_custom_flags] = useState<string>(tailscaleUpCustomFlags);
      const [manual_node_ip, set_manual_node_ip] = useState<string>(tailscaleManualNodeIP);

      return <ConfirmModal closeModal={closePopup} strTitle="Advanced Settings"
        onOK={() => {
          login_server ? setLoginServer(login_server) : setLoginServer(TAILSCALE_LOGIN_SERVER);
          custom_flags ? setCustomFlags(custom_flags) : setCustomFlags(DEFAULT_TAILSCALE_UP_CUSTOM_FLAGS);
          manual_node_ip ? setManualNodeIP(manual_node_ip) : setManualNodeIP(MANUAL_NODE_IP);
          var tailscale_state_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE);
          // var ts_login_server_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_LOGIN_SERVER);
          // var ts_custom_flags_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_UP_CUSTOM_FLAGS);
          var tailscale_state = tailscale_state_getter? JSON.parse(tailscale_state_getter).value : false;
          // var ls = ts_login_server_getter? JSON.parse(ts_login_server_getter).value : "UNSET LS";
          // var cf = ts_custom_flags_getter? JSON.parse(ts_custom_flags_getter).value : "UNSET CF";
          if (tailscale_state) {
            callPluginMethod('down');
            tailscaleUp("Restarting with login server: "+ tailscaleLoginServer + ", custom flags: "+ tailscaleUpCustomFlags + ", and manual node ip: "+ tailscaleManualNodeIP);
          }
        }}>
            <p style={{color: 'red', fontWeight: 'bold'}}>NOTE: Only change stuff here if you know what you are doing, otherwise it may result in a broken config.</p>
            <p>Clicking Confirm will restart Tailscale if it is running</p>
            <TextField
              label="Tailscale Login Server"
              description="If you are running Headscale, use desktop mode to login for the 1st time (to generate login token). Leaving blank is default behavior."
              value={login_server} 
              onChange={(Event) => set_login_server(Event.target.value)} />
            <TextField
              label="Tailscale Up Custom Flags"
              description="Remember checking your --operator, which defaults to 'deck' for SteamOS (this needs to be set). Leaving the flag blank or omitting will reset to default i.e.: --operator=deck."
              value={custom_flags} 
              onChange={(Event) => set_custom_flags(Event.target.value)} />
            <TextField
              label="Tailscale Manual Node IP"
              description="If you are using a manual node IP, please enter it here. Leaving blank is default behavior."
              value={manual_node_ip}
              onChange={(Event) => set_manual_node_ip(Event.target.value)} />
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
    var manual_node_ip_getter = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_MANUAL_NODE_IP);
    var manual_node_ip_var = manual_node_ip_getter? JSON.parse(manual_node_ip_getter).value : '';
    node_ip_getter? JSON.parse(node_ip_getter).value : false;
    allow_lan_access_getter? JSON.parse(allow_lan_access_getter).value : true;
    exit_node_list_getter? JSON.parse(exit_node_list_getter).value : [
      { data: 0, label: "Unset" },
      { data: 1, label: manual_node_ip_var + " (Manual)" }
    ];
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
            checked={tailscaleAllowLAN}
            label='Toggle LAN Access'
            description='WARNING: Disabling LAN access, may cause your SSH to become inaccessible (this can be reversed by re-enabling)'
            disabled={tailscaleNodeIP === ''}
            onChange={toggleLANAccess} />
          <ButtonItem
            layout="below"
            onClick={popupMiscSetting}
            bottomSeparator='standard'>
            Advanced Settings
          </ButtonItem>
          <Field
            bottomSeparator='none'
            label={"Device Status"}/>
          <Focusable
            focusWithinClassName="gpfocuswithin"
            onActivate={() => {}}
            style={{
              width: '100%',
              alignContent: 'center',
              justifyContent: 'center',
              margin: 'auto',
              padding: 'auto',
            }}>
              {deviceStatus}
          </Focusable>
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
