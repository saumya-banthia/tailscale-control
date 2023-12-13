import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  ToggleField,
  SuspensefulImage,
} from "decky-frontend-lib";
import { VFC,
         useState,
         useEffect
        } from "react";
import { GiMeshNetwork } from "react-icons/gi";
import qr from "../assets/qr.svg"

const LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE = 'tailscaleToggle';

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {

  const [ tailscaleToggleState, setTailscaleToggleState ] = useState<boolean>(getInitialState(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, false, 'switchValue'));

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
          <tbody>
            <tr>
              <td>Device 1</td>
              <td>Online</td>
            </tr>
            </tbody>
        </table>
  </div>
  );

  function getInitialState(key: string, defaultState:any = 0, paramString:string = 'volume') {
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
  
  const toggleTailscale = async(switchValue: boolean) => {
    setTailscaleToggleState(switchValue);
    localStorage.setItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE, JSON.stringify({ switchValue }));
    await serverAPI.callPluginMethod((switchValue) ? 'up' : 'down', {});
  }

  const getTailscaleState = async () => {
    const data = await serverAPI.callPluginMethod("get_tailscale_state", {});
    if (data.success) {
      setTailscaleToggleState(Boolean(data.result));
    }
  }

  const getDeviceStatus = async () => {
    const data = await serverAPI.callPluginMethod("get_tailscale_device_status", {});
    console.log(data);
    if (data.success) {
      const deviceKeys = Object.keys(data.result);
      const transposedDeviceStatus = transposeObject(data.result);
      console.log(transposedDeviceStatus);
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

  useEffect(() => {
    const tailscaleToggle = localStorage.getItem(LOCAL_STORAGE_KEY_TAILSCALE_TOGGLE);
    if (tailscaleToggle) {
      const { switchValue } = JSON.parse(tailscaleToggle);
      setTailscaleToggleState(switchValue);
    }
    getTailscaleState();
    if (tailscaleToggleState){
      getDeviceStatus();
    }
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
