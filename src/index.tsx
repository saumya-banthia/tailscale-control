import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  ToggleField
} from "decky-frontend-lib";
import { VFC,
         useState 
        } from "react";
import { GiMeshNetwork } from "react-icons/gi";
import * as backend from "./backend"

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  backend.setServer(serverAPI);

  const [ tailscaleToggle, setTailscaleToggle ] = useState(false);

  backend.resolvePromise(backend.getTailscaleState(), setTailscaleToggle);
  
  const toggleTailscale = async(switchValue: boolean) => {
    setTailscaleToggle(switchValue);
    await serverAPI.callPluginMethod((switchValue) ? 'up' : 'down', {});
  }

  return (
    <PanelSection title="Settings">
        <PanelSectionRow>
          <ToggleField
          bottomSeparator='standard'
          checked={tailscaleToggle}
          label='Toggle Tailscale'
          description='Toggles Tailscale On or Off'
          onChange={toggleTailscale} />
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
