import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStores } from 'src/store';
import NotificationBadge from './NotificationBadge';
import Tooltip from './Tooltip';
import Scroll from './Scroll';
import { IndicatorIcon, ActiveIcon, EmptyStateIcon, SettingIcon, DeleteIcon, InfoCircleIcon, BackIcon } from './Icons';
import '../../sass/components/_studylegend.scss';
import { TooltipsContent } from '../Constant';
import Menu from './Menu';

const StudyIcon = ({ Icon, props }: { Icon: any; props?: any }) => <Icon {...props} />;

const EmptyView = () => (
    <div className='sc-studies--empty'>
        <EmptyStateIcon />
        <p>{t.translate('You have no active indicators yet.')}</p>
    </div>
);

const NoResultView = ({ text }: { text: string }) => (
    <div className='sc-studies--empty'>
        <strong>
            {t.translate('No results for')} “{text}”
        </strong>
        <p>{t.translate('Try checking your spelling or use a different term')}</p>
    </div>
);

const IndicatorList = ({ items, onSelectItem, onDeleteItem, onEditItem, onInfoItem, disableAll, isTick }: any) => (
    <div className='sc-studies__list'>
        {items.map((Item: any) => (
            <div
                key={`item--${Item.id}`}
                className={classNames('sc-studies__list__item ', {
                    'sc-studies__list__item--disabled': disableAll,
                    'sc-studies__list__item--disabled-prediction': Item.isPrediction && isTick,
                })}
            >
                <Tooltip
                    className='sc-studies__list__item__box'
                    enabled={
                        !!((onEditItem || onDeleteItem) && Item.bars && Item.bars.length > 30) ||
                        (Item.isPrediction && isTick)
                    }
                    content={
                        Item.isPrediction && isTick
                            ? TooltipsContent.predictionIndicator
                            : `${Item.name} ${Item.bars ? `(${Item.bars})` : ''}`
                    }
                >
                    <div className='info' onClick={() => (onSelectItem ? onSelectItem(Item.id) : null)}>
                        <StudyIcon Icon={Item.icon} />
                        <div className='text'>
                            <span>{Item.name}</span>
                            {Item.bars && <small>({Item.bars})</small>}
                        </div>
                    </div>
                    <div className='detail'>
                        {onInfoItem && <InfoCircleIcon className='ic-info' onClick={() => onInfoItem(Item)} />}
                        {onEditItem && <SettingIcon onClick={() => onEditItem(Item.dataObject)} />}
                        {onDeleteItem && <DeleteIcon onClick={() => onDeleteItem(Item.dataObject.sd)} />}
                    </div>
                </Tooltip>
            </div>
        ))}
    </div>
);

const TabularDisplaySearchPanel = ({ categories, onSelectItem, onInfoItem, disableAll, isTick }: any) => (
    <Scroll autoHide>
        {categories.map((Category: any) => (
            <div key={Category.id} className='sc-studies__category'>
                <div className='sc-studies__category__head'>{Category.name}</div>
                <div className='sc-studies__category__body'>
                    <IndicatorList
                        items={Category.foundItems}
                        onSelectItem={onSelectItem}
                        onInfoItem={onInfoItem}
                        disableAll={disableAll}
                        isTick={isTick}
                    />
                </div>
            </div>
        ))}
    </Scroll>
);

const TabularDisplayActivePanel = ({ items, onDeleteItem, onEditItem, clearAll, isMobile }: any) => (
    <React.Fragment>
        <div className='sc-studies__panel__head'>
            <p>
                {isMobile
                    ? t.translate('Up to 2 active indicators allowed.')
                    : t.translate('Up to 5 active indicators allowed.')}
            </p>
            <button type='button' className='sc-btn sc-btn--sm sc-btn--outline-secondary' onClick={() => clearAll()}>
                {t.translate('Clear all')}
            </button>
        </div>
        <div className='sc-studies__panel__content sc-studies__panel__content--active'>
            <IndicatorList items={items} onDeleteItem={onDeleteItem} onEditItem={onEditItem} />
        </div>
    </React.Fragment>
);

const TabularDisplay = ({
    onSelectTab,
    selectedTab,
    categories,
    searchedCategories,
    onSelectItem,
    onDeleteItem,
    onEditItem,
    onInfoItem,
    activeItems,
    clearAll,
    searchQuery,
    isMobile,
    maxAllowedItem,
    isTick,
}: any) => (
    <Tabs className='tabs--vertical' selectedIndex={selectedTab} onSelect={onSelectTab}>
        <TabList>
            <Tab key='hidden' className='hidden' />
            <Tab key='active'>
                <ActiveIcon />
                <span>{t.translate('Active')}</span>
                <NotificationBadge notificationCount={activeItems.length} />
            </Tab>
            {categories.map((Category: any) => (
                <Tab key={`tab--${Category.id}`}>
                    <StudyIcon Icon={Category.icon} />
                    <span>{Category.name}</span>
                </Tab>
            ))}
        </TabList>
        <TabPanel key='panel--search'>
            <div className='sc-studies__panel sc-studies__panel--search'>
                {searchedCategories.length ? (
                    <TabularDisplaySearchPanel
                        categories={searchedCategories}
                        onSelectItem={onSelectItem}
                        onInfoItem={onInfoItem}
                        disableAll={activeItems.length === (isMobile ? 2 : 5)}
                        isTick={isTick}
                    />
                ) : (
                    <NoResultView text={searchQuery} />
                )}
            </div>
        </TabPanel>
        <TabPanel key='panel--active'>
            <div className='sc-studies__panel sc-studies__panel--active'>
                {activeItems.length ? (
                    <TabularDisplayActivePanel
                        clearAll={clearAll}
                        items={activeItems}
                        onDeleteItem={onDeleteItem}
                        onEditItem={onEditItem}
                        isMobile={isMobile}
                    />
                ) : (
                    <EmptyView />
                )}
            </div>
        </TabPanel>
        {categories.map((Category: any) => (
            <TabPanel key={`panel--${Category.id}`}>
                <div className='sc-studies__panel'>
                    <h3>{Category.name}</h3>
                    <IndicatorList
                        onSelectItem={onSelectItem}
                        onInfoItem={onInfoItem}
                        items={Category.items}
                        disableAll={activeItems.length === maxAllowedItem}
                        isTick={isTick}
                    />
                </div>
            </TabPanel>
        ))}
    </Tabs>
);

const StudyLegend: React.FC<any> = ({ portalNodeId }) => {
    const { studies, chart, timeperiod } = useStores();

    const {
        menuStore,
        deleteAllStudies: deleteAll,
        items,
        searchedItems,
        SearchInput,
        filterText: searchQuery,
        selectedTab,
        onSelectTab,
        onSelectItem,
        activeItems,
        deleteStudy,
        editStudy,
        onInfoItem,
        infoItem,
        updatePortalNode,
        maxAllowedItem,
    } = studies;
    const { isTick } = timeperiod;
    const { isMobile } = chart;
    const menuOpen = menuStore.open;
    const activeStudiesNo = activeItems.length;

    updatePortalNode(portalNodeId);
    return (
        <Menu
            store={menuStore}
            className='sc-studies'
            title={t.translate('Indicators')}
            tooltip={t.translate('Indicators')}
            modalMode
            enableTabular
            portalNodeId={portalNodeId}
            customHead={
                infoItem ? (
                    <div className='sc-dialog__head--info'>
                        <BackIcon onClick={() => onInfoItem(null)} />
                        {infoItem.name}
                    </div>
                ) : (
                    <div className='sc-dialog__head--search'>
                        <SearchInput />
                    </div>
                )
            }
        >
            <Menu.Title>
                <div className={`sc-studies__menu ${menuOpen ? 'sc-studies__menu--active' : ''}`}>
                    <IndicatorIcon />
                    <NotificationBadge notificationCount={activeStudiesNo} />
                </div>
            </Menu.Title>
            <Menu.Body>
                {infoItem && (
                    <div className='sc-studies__info'>
                        <Scroll autoHide height='360px' className='sc-studies__info__content'>
                            <p>{infoItem?.description}</p>
                        </Scroll>
                        <div className='sc-studies__info__footer'>
                            <Tooltip enabled={infoItem?.disabledAddBtn} content={TooltipsContent.predictionIndicator}>
                                <button
                                    type='button'
                                    className='sc-btn sc-btn--primary sc-btn--w100'
                                    onClick={() => onSelectItem(infoItem?.id)}
                                    disabled={infoItem?.disabledAddBtn}
                                >
                                    {t.translate('Add')}
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                )}
                <TabularDisplay
                    onSelectTab={onSelectTab}
                    selectedTab={selectedTab}
                    categories={items}
                    searchedCategories={searchedItems}
                    onSelectItem={onSelectItem}
                    onDeleteItem={deleteStudy}
                    onEditItem={editStudy}
                    onInfoItem={onInfoItem}
                    activeItems={activeItems}
                    clearAll={deleteAll}
                    searchQuery={searchQuery}
                    isMobile={isMobile}
                    maxAllowedItem={maxAllowedItem}
                    isTick={isTick}
                />
            </Menu.Body>
        </Menu>
    );
};

export default observer(StudyLegend);
