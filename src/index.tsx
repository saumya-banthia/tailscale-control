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

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {

  const [ tailscaleEnabled, setTailscaleEnabled ] = useState(false);
  
  const toggleTailscale = async(switchValue: boolean) => {
    setTailscaleEnabled(switchValue);
    await serverAPI.callPluginMethod((switchValue) ? 'up' : 'down', {});
  }

  return (
    <PanelSection title="Settings">
        <PanelSectionRow>
          <ToggleField
          bottomSeparator='standard'
          checked={tailscaleEnabled}
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
