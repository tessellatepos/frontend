export default function SettingsHome() {
    return (
        <div className={`flex p-5 w-full h-full flex-col gap-5`}>
            <h1 className={`text-2xl`}>General Settings</h1>
            <p className={`text-sm text-gray-500 max-w-2xl`}>
                The payment provider and its Square connection are under
                Providers.
            </p>
        </div>
    );
}
