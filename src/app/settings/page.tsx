import { useSettingsStore } from "@/stores/settings/useSettingsStore";
import Appearance from "@/app/settings/pages/appearance/page";
import Devices from "@/app/settings/pages/devices/page";
import SettingsHome from "@/app/settings/pages/general/page";
import SettingsMenuBar from "@/components/SettingsMenuBar";

export default function Config() {

	const { view } = useSettingsStore();

	const settingsPage = () => {
		if (view == "general") return <SettingsHome />;
		if (view == "appearance") return <Appearance />;
		if (view == "devices") return <Devices />;
	};

	return (
		<div>
			<div>
				<SettingsMenuBar />
			</div>
			<div>
				{settingsPage()}
			</div>
		</div>
	);
}
