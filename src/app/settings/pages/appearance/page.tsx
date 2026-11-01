/**
 * The app has one light theme and no theme setting yet, so this tab says so
 * instead of offering a control that does nothing.
 */
export default function Appearance() {
    return (
        <div className={`flex p-5 w-full h-full flex-col gap-5`}>
            <h1 className={`text-2xl`}>Appearance</h1>
            <p className={`text-sm text-gray-500 max-w-2xl`}>
                Tessellate uses its light theme everywhere. There is no
                appearance setting to change yet.
            </p>
        </div>
    );
}
