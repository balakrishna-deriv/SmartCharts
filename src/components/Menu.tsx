import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react-lite';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';
import MenuStore from 'src/store/MenuStore';
import { useStores } from 'src/store';
import MenuMobile from './MenuMobile';
import Tooltip from './Tooltip';
import { CloseIcon } from './Icons';

type TMenuProps = {
    store: MenuStore;
    className?: string;
    title?: string;
    isFullscreen?: boolean;
    portalNodeId?: string;
    enabled?: boolean;
    tooltip?: React.ReactNode;
    emptyMenu?: boolean;
    modalMode?: boolean;
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
    enableTabular?: boolean;
    customHead?: React.ReactElement;
};

type TMenuFC = React.FunctionComponent<TMenuProps> & {
    Title: React.FC;
    Body: React.FC;
};

const Menu: React.FC<TMenuProps> = ({
    store,
    className,
    children,
    title,
    tooltip,
    isFullscreen,
    portalNodeId,
    enabled = true,
    onMouseEnter,
    onMouseLeave,
    enableTabular,
    customHead,
    emptyMenu,
    modalMode,
}) => {
    const { open, dialogStatus, onTitleClick, handleCloseDialog, DropDownDialog } = store;

    const { chartSetting, chart } = useStores();

    const { theme } = chartSetting;
    const { shouldRenderDialogs, isMobile, context: ready } = chart;

    const onOverlayClick: React.MouseEventHandler<HTMLDivElement> = e => {
        if (e.currentTarget.className === 'cq-modal__overlay') {
            handleCloseDialog();
        }
    };

    if (!ready) return '';

    const first = React.Children.map(children, (child: React.ReactNode, i: number) => (i === 0 ? child : null));
    const rest = React.Children.map(children, (child: React.ReactNode, i: number) => (i !== 0 ? child : null));

    if (modalMode) {
        const portalNode = document.getElementById(portalNodeId || 'smartcharts_modal');
        if (!portalNode) return '';

        const newDialog = ReactDOM.createPortal(
            <div className={`smartcharts-${theme}`}>
                <div
                    className={classNames({
                        'smartcharts-mobile': isMobile,
                        'smartcharts-desktop': !isMobile,
                    })}
                >
                    <div
                        className={classNames('cq-modal-dropdown', className, {
                            stxMenuActive: open,
                        })}
                    >
                        <div className='cq-modal__overlay' onClick={onOverlayClick}>
                            <CSSTransition appear in={dialogStatus} timeout={300} classNames='sc-dialog' unmountOnExit>
                                <DropDownDialog
                                    isMobile={isMobile}
                                    isFullscreen={isFullscreen}
                                    title={title}
                                    handleCloseDialog={handleCloseDialog}
                                    enableTabular={enableTabular}
                                    customHead={customHead}
                                >
                                    {rest}
                                </DropDownDialog>
                            </CSSTransition>
                        </div>
                    </div>
                </div>
            </div>,
            portalNode
        );

        if (emptyMenu) {
            return open && newDialog;
        }

        return (
            <Tooltip
                className={classNames('ciq-menu', className || '', {
                    stxMenuActive: enabled && open,
                    'ciq-enabled': enabled,
                    'ciq-disabled': !enabled,
                })}
                content={tooltip}
                enabled={!!tooltip}
                position='right'
            >
                <div
                    className='cq-menu-btn'
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={enabled ? onTitleClick : () => null}
                >
                    {first}
                </div>
                {enabled && open && newDialog}
            </Tooltip>
        );
    }

    const oldDropdown = shouldRenderDialogs ? (
        <DropDownDialog
            className={classNames('cq-menu-dropdown', {
                'cq-menu-dropdown-enter-done': dialogStatus,
            })}
            isMobile={isMobile}
            isFullscreen={isFullscreen}
        >
            {title && (
                <div className='title'>
                    <div className='title-text'>{title}</div>
                    <CloseIcon className='icon-close-menu' onClick={onTitleClick} />
                </div>
            )}
            {rest}
        </DropDownDialog>
    ) : null;

    return (
        (enabled && (
            <div className={classNames('ciq-menu ciq-enabled', className, { stxMenuActive: open })}>
                <div
                    className='cq-menu-btn'
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={onTitleClick}
                >
                    {first}
                </div>
                {(isMobile && portalNodeId && (
                    <MenuMobile
                        className={className}
                        open={open}
                        menu_element={oldDropdown}
                        portalNodeId={portalNodeId}
                        onClick={onOverlayClick}
                    />
                )) ||
                    oldDropdown}
            </div>
        )) || (
            <div className={classNames('ciq-menu ciq-disabled', className)}>
                <div className='cq-menu-btn' onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                    {first}
                </div>
            </div>
        )
    );
};

const ObservedMenu = observer(Menu) as TMenuFC;

const MenuSubComponent: React.FC = ({ children }) => {
    return <React.Fragment>{children}</React.Fragment>;
};

ObservedMenu.Title = MenuSubComponent;
ObservedMenu.Body = MenuSubComponent;

export default ObservedMenu;
