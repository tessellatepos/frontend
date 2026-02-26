import type { SettingsView } from "@/stores/settings/useSettingsStore.ts";
import { useSettingsStore } from "@/stores/settings/useSettingsStore.ts";

export default function SettingsMenuBar() {
	const { view } = useSettingsStore();

	const menuItems = [
		{ name: "General", view: "general" },
		{ name: "Appearance", view: "appearance" },
		{ name: "Devices", view: "devices" },
	];

	return (
		<div>
			{menuItems.map((item) => (
				<div className={view == item.view ? "active" : "bg-blue-500"} key={item.view}>
					<SettingsMenuItem key={item.view} name={item.name} view={item.view as SettingsView} />
				</div>
			))}
		</div>
	)
}

function SettingsMenuItem({ name, view }: { name: string, view: SettingsView }) {
	const { setView } = useSettingsStore();

	return (
		<div onClick={() => setView(view)}>
			{name}
		</div>
	)
}
