import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    pluginName: string;
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

/**
 * Isolates a single plugin's render errors so a failing plugin cannot
 * crash the surrounding POS UI. Logs the error and renders nothing
 * (the POS continues without that plugin's contribution).
 */
export class PluginErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(
            `[plugin-host] Plugin "${this.props.pluginName}" render error:`,
            error,
            info,
        );
    }

    render() {
        if (this.state.hasError) return null;
        return this.props.children;
    }
}
