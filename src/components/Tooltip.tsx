import React from 'react';
import classNames from 'classnames';

const Tooltip = ({
    children,
    className = '',
    enabled = false,
    content,

    // top, right
    position = 'top',

    ...props
}: any) => (
    <div
        className={classNames('sc-tooltip', className, {
            [`sc-tooltip--${position}`]: !!position,
            'sc-tooltip--enable': enabled,
        })}
        {...props}
    >
        {children}
        <div className='sc-tooltip__inner'>{content}</div>
    </div>
);

export default Tooltip;
