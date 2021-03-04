// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import React from 'react';

// this hook mimics this.setState({ state: value, ... }, () => callbackFunc());
export const useStateCallback = (initial_state: any) => {
    const [state, setState] = React.useState(initial_state);
    const callbackRef = React.useRef(null); // a mutable ref to store existing callback

    const setStateCallback = (current_state: any, cb: any) => {
        callbackRef.current = cb; // store the passed callback to the ref
        setState(current_state);
    };

    React.useEffect(() => {
        // callback ref current is null on initial render, so we only execute callback on state
        if (callbackRef.current) {
            callbackRef.current(state);
            callbackRef.current = null; // we need to reset the callback after execution
        }
    }, [state]);

    return [state, setStateCallback];
};
